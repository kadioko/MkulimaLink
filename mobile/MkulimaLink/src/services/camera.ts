import {launchImageLibrary, launchCamera, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import RNFS from 'react-native-fs';
import {apiService, uploadApi} from './api';

export interface ImageUploadOptions {
  mediaType?: MediaType;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  includeBase64?: boolean;
  cropping?: boolean;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
}

class CameraService {
  private static instance: CameraService;

  private constructor() {}

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Request camera permission for Android
   */
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'MkulimaLink needs camera access to take photos of your products',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  }

  /**
   * Request storage permission for Android
   */
  async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'MkulimaLink needs storage access to save and upload photos',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Storage permission error:', error);
      return false;
    }
  }

  /**
   * Open camera to take photo
   */
  async takePhoto(options: ImageUploadOptions = {}): Promise<ImagePickerResponse> {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      throw new Error('Camera permission denied');
    }

    const defaultOptions = {
      mediaType: 'photo' as MediaType,
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      includeBase64: false,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    return new Promise((resolve) => {
      launchCamera(
        { ...defaultOptions, ...options },
        (response) => {
          resolve(response);
        }
      );
    });
  }

  /**
   * Open gallery to select image
   */
  async selectFromGallery(options: ImageUploadOptions = {}): Promise<ImagePickerResponse> {
    const hasPermission = await this.requestStoragePermission();
    if (!hasPermission) {
      throw new Error('Storage permission denied');
    }

    const defaultOptions = {
      mediaType: 'photo' as MediaType,
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      includeBase64: false,
      selectionLimit: 5, // Allow multiple selection
    };

    return new Promise((resolve) => {
      launchImageLibrary(
        { ...defaultOptions, ...options },
        (response) => {
          resolve(response);
        }
      );
    });
  }

  /**
   * Show image picker options
   */
  async showImagePicker(options: ImageUploadOptions = {}): Promise<ImagePickerResponse | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Image',
        'Choose how to add your image',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              try {
                const result = await this.takePhoto(options);
                resolve(result);
              } catch (error) {
                Alert.alert('Error', 'Failed to access camera');
                resolve(null);
              }
            },
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              try {
                const result = await this.selectFromGallery(options);
                resolve(result);
              } catch (error) {
                Alert.alert('Error', 'Failed to access gallery');
                resolve(null);
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  }

  /**
   * Compress image to reduce file size
   */
  async compressImage(imageUri: string, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<string> {
    // For now, return the original URI
    // In a real implementation, you would use a library like react-native-image-resizer
    // to compress the image before uploading
    return imageUri;
  }

  /**
   * Upload single image to server
   */
  async uploadImage(imageUri: string, type: string = 'product'): Promise<UploadResult> {
    try {
      // Compress image first
      const compressedUri = await this.compressImage(imageUri);

      // Create form data
      const formData = new FormData();

      // Get file info
      const fileInfo = await RNFS.stat(compressedUri);
      const fileName = fileInfo.path.split('/').pop() || 'image.jpg';

      // Add file to form data
      formData.append('file', {
        uri: Platform.OS === 'android' ? compressedUri : compressedUri.replace('file://', ''),
        type: 'image/jpeg',
        name: fileName,
      } as any);

      formData.append('type', type);

      // Upload to server
      const result = await uploadApi.uploadImage(formData);

      return {
        success: true,
        url: result.url,
        fileName,
        fileSize: fileInfo.size,
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(imageUris: string[], type: string = 'product'): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const uri of imageUris) {
      const result = await this.uploadImage(uri, type);
      results.push(result);

      // Add small delay between uploads to avoid overwhelming the server
      if (imageUris.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Delete image from local storage
   */
  async deleteLocalImage(imageUri: string): Promise<void> {
    try {
      if (Platform.OS === 'android' && imageUri.startsWith('file://')) {
        imageUri = imageUri.replace('file://', '');
      }

      const exists = await RNFS.exists(imageUri);
      if (exists) {
        await RNFS.unlink(imageUri);
      }
    } catch (error) {
      console.error('Failed to delete local image:', error);
    }
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(imageUri: string): Promise<{width: number; height: number} | null> {
    // This would typically use a library like react-native-image-size
    // For now, return null
    return null;
  }

  /**
   * Validate image file
   */
  validateImage(response: ImagePickerResponse): {
    isValid: boolean;
    error?: string;
    assets?: any[];
  } {
    if (response.didCancel) {
      return { isValid: false, error: 'User cancelled image picker' };
    }

    if (response.errorMessage) {
      return { isValid: false, error: response.errorMessage };
    }

    if (!response.assets || response.assets.length === 0) {
      return { isValid: false, error: 'No image selected' };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedAssets = response.assets.filter(asset => (asset.fileSize || 0) > maxSize);

    if (oversizedAssets.length > 0) {
      return { isValid: false, error: 'Image file size too large (max 10MB)' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidAssets = response.assets.filter(asset =>
      !allowedTypes.includes(asset.type || '')
    );

    if (invalidAssets.length > 0) {
      return { isValid: false, error: 'Invalid image format. Please use JPEG, PNG, or WebP' };
    }

    return { isValid: true, assets: response.assets };
  }
}

// Create singleton instance
export const cameraService = CameraService.getInstance();

// React hook for camera and file upload
export const useCamera = () => {
  const takePhoto = (options?: ImageUploadOptions) =>
    cameraService.takePhoto(options);

  const selectFromGallery = (options?: ImageUploadOptions) =>
    cameraService.selectFromGallery(options);

  const showImagePicker = (options?: ImageUploadOptions) =>
    cameraService.showImagePicker(options);

  const uploadImage = (uri: string, type?: string) =>
    cameraService.uploadImage(uri, type);

  const uploadImages = (uris: string[], type?: string) =>
    cameraService.uploadImages(uris, type);

  const deleteLocalImage = (uri: string) =>
    cameraService.deleteLocalImage(uri);

  const validateImage = (response: ImagePickerResponse) =>
    cameraService.validateImage(response);

  const requestCameraPermission = () =>
    cameraService.requestCameraPermission();

  const requestStoragePermission = () =>
    cameraService.requestStoragePermission();

  return {
    takePhoto,
    selectFromGallery,
    showImagePicker,
    uploadImage,
    uploadImages,
    deleteLocalImage,
    validateImage,
    requestCameraPermission,
    requestStoragePermission,
  };
};

export default cameraService;
