import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { Gavel, Clock, Users } from 'lucide-react';
import api, { extractData } from '../api/axios';
import { ProductCardSkeleton, ErrorState } from '../components/EnhancedSkeleton';

function AuctionCard({ auction }) {
  const timeLeft = auction.timeLeft || 0;
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);

  return (
    <div className="bg-white border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-slate-900 truncate">{auction.product?.name || 'Auction'}</h3>
        <Gavel className="text-emerald-600 flex-shrink-0" size={20} />
      </div>
      <p className="text-sm text-slate-500 mb-3">
        Seller: {auction.seller?.name || 'Unknown'}
      </p>
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="font-semibold text-emerald-700">
          Current: TZS {auction.currentBid?.toLocaleString() || auction.startingBid?.toLocaleString()}
        </span>
        <span className={`flex items-center gap-1 ${auction.isEndingSoon ? 'text-red-600' : 'text-slate-500'}`}>
          <Clock size={14} />
          {hours}h {minutes}m
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users size={14} />
          {auction.bids?.length || 0} bids
        </span>
        <span>{auction.status}</span>
      </div>
      <Link
        to={`/auctions/${auction._id}`}
        className="mt-4 block text-center bg-emerald-600 text-white py-2 text-sm font-semibold hover:bg-emerald-700 transition-colors"
      >
        View Auction
      </Link>
    </div>
  );
}

function Auctions() {
  const { data: auctions, isLoading, error, refetch } = useQuery('active-auctions', async () => {
    const response = await api.get('/auctions/active');
    return extractData(response) || response.data;
  });

  if (isLoading) {
    return <ProductCardSkeleton count={6} />;
  }

  if (error) {
    return <ErrorState title="Couldn't load auctions" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Live Auctions</h1>
        <span className="text-sm text-slate-500">{auctions?.length || 0} active</span>
      </div>

      {auctions?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction._id} auction={auction} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <Gavel size={48} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium text-slate-600">No active auctions</p>
          <p className="text-sm">Check back later for new listings</p>
        </div>
      )}
    </div>
  );
}

export default Auctions;
