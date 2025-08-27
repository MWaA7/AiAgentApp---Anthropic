import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId] = useState<number>(Math.floor(Math.random() * 1000000));
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Replace with your actual API endpoint
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input,
          thread_id: threadId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const res = await response.text();

      const responseContent = res.replace(/\\n/g, '\n');

      // Add AI response
      const aiMessage: Message = {
        id: Date.now() + 1,
        content: responseContent,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      // Add error message
      const errorMessage: Message = {
        id: Date.now() + 1,
        content: "Sorry, I couldn't process your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="add-circle-outline" size={48} color="#a0a0a0" />
      </View>
      <Text style={styles.emptyTitle}>Start a new conversation</Text>
      <Text style={styles.emptySubtitle}>Ask me anything!</Text>
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}>
      <View style={[styles.avatar, item.isUser ? styles.userAvatar : styles.aiAvatar]}>
        <Text style={styles.avatarText}>{item.isUser ? 'You' : 'AI'}</Text>
      </View>
      <View style={styles.messageContent}>
        <View
          style={[
            styles.messageBubble,
            item.isUser ? styles.userMessageBubble : styles.aiMessageBubble,
          ]}>
          <Text style={styles.messageText}>{item.content}</Text>
        </View>
        <Text style={[styles.timestamp, item.isUser ? styles.userTimestamp : styles.aiTimestamp]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  const renderLoadingIndicator = () => {
    if (!loading) return null;

    return (
      <View style={[styles.messageContainer, styles.aiMessageContainer]}>
        <View style={[styles.avatar, styles.aiAvatar]}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
        <View style={styles.messageContent}>
          <View style={[styles.messageBubble, styles.aiMessageBubble, styles.loadingBubble]}>
            <ActivityIndicator size="small" color="#a0a0a0" />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'AI Agent Chat',
          headerStyle: { backgroundColor: '#3b3d42' },
          headerTitleStyle: {
            color: '#e4e4e4',
          },
        }}
      />
      <StatusBar barStyle="dark-content" backgroundColor="#3b3d42" />

      {messages.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesContent}
          ListFooterComponent={renderLoadingIndicator}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#a0a0a0"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() || loading ? styles.disabledButton : null]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
          activeOpacity={0.7}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#e4e4e4',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  aiAvatar: {
    backgroundColor: '#3b3d42',
  },
  userAvatar: {
    backgroundColor: '#7289da',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  messageContent: {
    flexDirection: 'column',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 4,
    maxWidth: '100%',
  },
  aiMessageBubble: {
    backgroundColor: '#232428',
  },
  userMessageBubble: {
    backgroundColor: '#2f3136',
  },
  messageText: {
    color: '#e4e4e4',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    color: '#a0a0a0',
  },
  userTimestamp: {
    alignSelf: 'flex-end',
  },
  aiTimestamp: {
    alignSelf: 'flex-start',
  },
  loadingBubble: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#2f3136',
    borderRadius: 4,
    paddingHorizontal: 16,
    color: '#e4e4e4',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7289da',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  disabledButton: {
    backgroundColor: '#3b3d42',
    opacity: 0.7,
  },
});
