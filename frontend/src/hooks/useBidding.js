import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import api from '../api/axios';

export const useBidding = (auctionId, userId) => {
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [winner, setWinner] = useState(null);

  const { sendMessage, isConnected } = useWebSocket(
    process.env.REACT_APP_AUCTION_WS_URL || 'wss://api.mkulimalink.com/auction',
    {
      onOpen: () => {
        // Join auction room
        sendMessage({
          type: 'join_auction',
          auctionId,
          userId,
        });
      },
      onMessage: (data) => {
        handleAuctionMessage(data);
      },
    }
  );

  const handleAuctionMessage = useCallback((data) => {
    switch (data.type) {
      case 'bid_placed':
        setBids((prev) => [data.bid, ...prev]);
        setCurrentBid(data.bid.amount);
        break;
      
      case 'auction_updated':
        setAuction(data.auction);
        setCurrentBid(data.auction.currentBid);
        break;
      
      case 'timer_update':
        setTimeLeft(data.timeLeft);
        break;
      
      case 'auction_ended':
        setWinner(data.winner);
        setAuction((prev) => ({ ...prev, status: 'ended' }));
        break;
      
      case 'bidder_joined':
        // Update bidder count
        break;
      
      case 'outbid':
        // Notify user they've been outbid
        break;
      
      default:
        break;
    }
  }, []);

  // Fetch auction details
  const fetchAuction = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/auctions/${auctionId}`);
      setAuction(response.data);
      setCurrentBid(response.data.currentBid);
      setBids(response.data.bids || []);
      setTimeLeft(response.data.timeLeft);
    } catch (err) {
      setError(err.message);
      // Mock data for development
      setAuction({
        id: auctionId,
        product: { name: 'Premium Maize', image: null },
        startingBid: 20000,
        currentBid: 28500,
        minIncrement: 500,
        status: 'active',
        endTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        totalBids: 12,
        bidderCount: 5,
      });
      setCurrentBid(28500);
      setTimeLeft(1800); // 30 minutes
    } finally {
      setIsLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    fetchAuction();
  }, [fetchAuction]);

  // Countdown timer
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const placeBid = useCallback(async (amount) => {
    if (!auction || amount < currentBid + auction.minIncrement) {
      setError(`Bid must be at least ${currentBid + auction.minIncrement}`);
      return false;
    }

    setIsLoading(true);
    try {
      // Send via WebSocket for real-time
      sendMessage({
        type: 'place_bid',
        auctionId,
        userId,
        amount,
        timestamp: new Date().toISOString(),
      });

      // Also send via API for persistence
      await api.post(`/api/auctions/${auctionId}/bid`, {
        amount,
        userId,
      });

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [auction, auctionId, userId, currentBid, sendMessage]);

  const autoBid = useCallback((maxAmount) => {
    // Set up auto-bidding up to maxAmount
    sendMessage({
      type: 'set_auto_bid',
      auctionId,
      userId,
      maxAmount,
      increment: auction?.minIncrement || 500,
    });
  }, [auctionId, userId, auction, sendMessage]);

  const cancelAutoBid = useCallback(() => {
    sendMessage({
      type: 'cancel_auto_bid',
      auctionId,
      userId,
    });
  }, [auctionId, userId, sendMessage]);

  const formatTimeLeft = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return {
    auction,
    bids,
    currentBid,
    isLoading,
    error,
    timeLeft,
    timeLeftFormatted: formatTimeLeft(timeLeft),
    winner,
    isConnected,
    placeBid,
    autoBid,
    cancelAutoBid,
    refresh: fetchAuction,
  };
};

// Hook for auction list
export const useAuctionList = (filters = {}) => {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAuctions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/auctions', { params: filters });
      setAuctions(response.data);
    } catch (err) {
      // Mock data
      setAuctions([
        {
          id: 'auc1',
          product: { name: 'Premium Maize', image: null, category: 'Grains' },
          currentBid: 28500,
          startingBid: 20000,
          bidCount: 12,
          endTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
          status: 'active',
          location: 'Morogoro',
        },
        {
          id: 'auc2',
          product: { name: 'Fresh Tomatoes', image: null, category: 'Vegetables' },
          currentBid: 4500,
          startingBid: 3000,
          bidCount: 8,
          endTime: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
          status: 'active',
          location: 'Arusha',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  return {
    auctions,
    isLoading,
    refresh: fetchAuctions,
  };
};

export default useBidding;
