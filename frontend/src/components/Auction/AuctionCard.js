import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, TrendingUp, Gavel } from 'lucide-react';
import OptimizedImage from '../OptimizedImage';

const AuctionCard = ({ auction, onClick, currency = 'TZS' }) => {
  const isEndingSoon = auction.timeLeft && auction.timeLeft < 300; // < 5 minutes
  const isEnded = auction.status === 'ended';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onClick?.(auction)}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
        {auction.product?.image ? (
          <OptimizedImage
            src={auction.product.image}
            alt={auction.product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🏷️
          </div>
        )}
        
        {/* Status badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white ${
          isEnded ? 'bg-gray-500' :
          isEndingSoon ? 'bg-red-500 animate-pulse' :
          'bg-green-500'
        }`}>
          {isEnded ? 'Ended' : isEndingSoon ? 'Ending Soon!' : 'Active'}
        </div>

        {/* Bid count */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-white text-xs">
          <Gavel size={14} />
          {auction.bidCount || 0} bids
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {auction.product?.category}
        </span>
        <h3 className="font-bold text-gray-900 dark:text-white mt-1 group-hover:text-green-600 transition-colors">
          {auction.product?.name}
        </h3>
        
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold text-green-600">
            {currency} {auction.currentBid?.toLocaleString()}
          </span>
          <span className="text-sm text-gray-400">
            {auction.bidCount || 0} bids
          </span>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          {/* Time left */}
          <div className={`flex items-center gap-1.5 text-sm ${
            isEndingSoon ? 'text-red-500 font-semibold' : 'text-gray-500'
          }`}>
            <Clock size={16} />
            {auction.timeLeftFormatted || '--'}
          </div>

          {/* Bidders */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Users size={16} />
            {auction.bidderCount || 0} bidders
          </div>
        </div>

        {/* Location */}
        <p className="mt-3 text-sm text-gray-500">
          📍 {auction.location || 'Tanzania'}
        </p>
      </div>
    </motion.div>
  );
};

export default AuctionCard;
