import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Layers, X, Filter } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import OptimizedImage from '../OptimizedImage';

// Fix Leaflet default icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker icon based on category
const getCategoryIcon = (category) => {
  const colors = {
    'Grains': '#eab308',
    'Vegetables': '#22c55e',
    'Fruits': '#f97316',
    'Livestock': '#8b5cf6',
    'Dairy': '#3b82f6',
    'Inputs': '#64748b',
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${colors[category] || '#22c55e'}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${category?.[0] || 'P'}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

const ProductMap = ({ 
  products = [], 
  center = [-6.7924, 39.2083], // Dar es Salaam
  zoom = 10,
  onProductSelect,
  userLocation = null,
  showRadius = false,
  radiusKm = 50,
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategories, setActiveCategories] = useState([]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return cats;
  }, [products]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (activeCategories.length === 0) return products;
    return products.filter(p => activeCategories.includes(p.category));
  }, [products, activeCategories]);

  // Map bounds component
  const MapBounds = ({ products }) => {
    const map = useMap();
    
    useEffect(() => {
      if (products.length > 0) {
        const bounds = L.latLngBounds(products.map(p => [p.latitude, p.longitude]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [map, products]);
    
    return null;
  };

  // Locate user button component
  const LocateControl = () => {
    const map = useMap();
    
    const handleLocate = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo([latitude, longitude], 13);
            setMapCenter([latitude, longitude]);
          },
          (error) => console.error('Geolocation error:', error)
        );
      }
    };

    return (
      <button
        onClick={handleLocate}
        className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50"
        title="My location"
      >
        <Navigation size={20} className="text-gray-600" />
      </button>
    );
  };

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds products={filteredProducts} />
        <LocateControl />

        {/* User location marker */}
        {userLocation && (
          <>
            <Marker 
              position={[userLocation.lat, userLocation.lng]}
              icon={L.divIcon({
                className: 'user-location',
                html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            />
            {showRadius && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={radiusKm * 1000}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }}
              />
            )}
          </>
        )}

        {/* Product markers */}
        {filteredProducts.map((product) => (
          <Marker
            key={product._id}
            position={[product.latitude || center[0] + (Math.random() - 0.5) * 0.1, 
                       product.longitude || center[1] + (Math.random() - 0.5) * 0.1]}
            icon={getCategoryIcon(product.category)}
            eventHandlers={{
              click: () => {
                setSelectedProduct(product);
                onProductSelect?.(product);
              },
            }}
          >
            <Popup>
              <ProductPopup product={product} onView={() => onProductSelect?.(product)} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Filter overlay */}
      <div className="absolute top-4 left-4 z-[1000]">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Filter size={20} className="text-gray-600" />
          <span className="text-sm font-medium">Filter</span>
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 bg-white rounded-lg shadow-lg p-3 w-48"
            >
              <p className="text-xs font-semibold text-gray-500 mb-2">Categories</p>
              {categories.map((cat) => (
                <label key={cat} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeCategories.includes(cat)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setActiveCategories([...activeCategories, cat]);
                      } else {
                        setActiveCategories(activeCategories.filter(c => c !== cat));
                      }
                    }}
                    className="rounded text-green-600"
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected product card */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute bottom-4 right-4 z-[1000] w-72 bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-2 right-2 p-1 bg-black/20 rounded-full text-white hover:bg-black/30 z-10"
            >
              <X size={16} />
            </button>
            
            <div className="h-32 bg-gray-200">
              {selectedProduct.image ? (
                <OptimizedImage
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  🌾
                </div>
              )}
            </div>
            
            <div className="p-4">
              <span className="text-xs text-gray-500">{selectedProduct.category}</span>
              <h3 className="font-bold text-gray-900">{selectedProduct.name}</h3>
              <p className="text-green-600 font-semibold mt-1">
                {selectedProduct.currency} {selectedProduct.price?.toLocaleString()} / {selectedProduct.unit}
              </p>
              <button
                onClick={() => onProductSelect?.(selectedProduct)}
                className="mt-3 w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                View Details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductPopup = ({ product, onView }) => (
  <div className="p-2 min-w-[200px]">
    <h3 className="font-bold text-gray-900">{product.name}</h3>
    <p className="text-sm text-gray-500">{product.category}</p>
    <p className="text-green-600 font-semibold mt-1">
      {product.currency} {product.price?.toLocaleString()}
    </p>
    <button
      onClick={onView}
      className="mt-2 w-full py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
    >
      View Product
    </button>
  </div>
);

export default ProductMap;
