import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link2, Check, Facebook, Twitter, Linkedin, Mail, X, MessageCircle } from 'lucide-react';

const ShareButton = ({ product, variant = 'icon' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/products/${product?._id}`
    : '';
  
  const shareText = `Check out ${product?.name} on MkulimaLink - ${product?.price} ${product?.currency} per ${product?.unit}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500',
      action: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600',
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      },
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500',
      action: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
      },
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700',
      action: () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
      },
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600',
      action: () => {
        window.open(`mailto:?subject=${encodeURIComponent(product?.name)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`);
      },
    },
  ];

  if (variant === 'button') {
    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 transition-colors"
        >
          <Share2 size={18} />
          Share
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <ShareMenu
              shareOptions={shareOptions}
              shareUrl={shareUrl}
              copied={copied}
              onCopy={handleCopyLink}
              onClose={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Icon variant
  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Share2 size={20} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <ShareMenu
            shareOptions={shareOptions}
            shareUrl={shareUrl}
            copied={copied}
            onCopy={handleCopyLink}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ShareMenu = ({ shareOptions, shareUrl, copied, onCopy, onClose }) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="font-semibold text-gray-900 dark:text-white">Share Product</span>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-5 gap-2 p-4">
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <motion.button
                key={option.name}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={option.action}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
              >
                <div className={`w-10 h-10 ${option.color} rounded-full flex items-center justify-center text-white shadow-md`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">{option.name}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Copy link */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
            <Link2 size={16} className="text-gray-400 ml-1" />
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-gray-600 dark:text-gray-400 focus:outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCopy}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                copied
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <Check size={14} />
                  Copied!
                </span>
              ) : (
                'Copy'
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ShareButton;
