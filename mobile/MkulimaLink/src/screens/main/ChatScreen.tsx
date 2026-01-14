import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

interface Chat {
  id: string;
  participant: {
    name: string;
    avatar?: string;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    isMine: boolean;
  };
  unreadCount: number;
}

const ChatScreen: React.FC = () => {
  // Mock chat data - replace with API call
  const chats: Chat[] = [
    {
      id: '1',
      participant: { name: 'John Farmer', avatar: '👨‍🌾' },
      lastMessage: {
        text: 'Your order is ready for pickup',
        timestamp: '2h ago',
        isMine: false,
      },
      unreadCount: 2,
    },
    {
      id: '2',
      participant: { name: 'Mary Produce', avatar: '👩‍🌾' },
      lastMessage: {
        text: 'Thank you for your business!',
        timestamp: '1d ago',
        isMine: true,
      },
      unreadCount: 0,
    },
    {
      id: '3',
      participant: { name: 'Peter Tomatoes', avatar: '👨‍🍅' },
      lastMessage: {
        text: 'When can you deliver?',
        timestamp: '2d ago',
        isMine: false,
      },
      unreadCount: 1,
    },
  ];

  const renderChat = ({ item }: { item: Chat }) => (
    <TouchableOpacity style={styles.chatItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.participant.avatar || '👤'}</Text>
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.participantName}>{item.participant.name}</Text>
          <Text style={styles.timestamp}>{item.lastMessage.timestamp}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text
            style={styles.lastMessage}
            numberOfLines={1}
          >
            {item.lastMessage.isMine && 'You: '}{item.lastMessage.text}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Chat with farmers and buyers</Text>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContainer: {
    padding: 16,
  },
  chatItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatScreen;
