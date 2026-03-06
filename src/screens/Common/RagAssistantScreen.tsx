import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { JSX, useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Text } from '../../components/ScaledText';
import ScreenBody from '../../components/ScreenBody';
import { useTheme } from '../../hooks/useTheme';
import { FOOTER_HEIGHT } from '../../theme';
import ReferenceEntryType from '../../types/data-type';
import { RagResponse, ragSearch } from '../../utils/ragSearch';

type RagAssistantNavigationProp = NativeStackNavigationProp<{
  Entry: { entry: ReferenceEntryType };
}>;

type MessageRole = 'user' | 'assistant';

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  response?: RagResponse;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! I'm the TOAST Reference Assistant. Ask me anything about survival, first aid, emergency procedures, or field skills — I'll find the relevant guide for you.\n\nEverything stays on your device. No internet required.",
};

/**
 * RagAssistantScreen is a chat-style interface that lets users ask natural
 * language questions and receive responses grounded in TOAST's offline
 * reference content.
 *
 * Features:
 * - On-device retrieval-augmented generation (RAG) using TF-IDF scoring
 * - Chat history preserved for the session
 * - "Jump to full section" navigation links on each result
 * - Graceful "nothing found" message when no relevant content exists
 * - Fully offline — no network calls
 */
export default function RagAssistantScreen(): JSX.Element {
  const navigation = useNavigation<RagAssistantNavigationProp>();
  const COLORS = useTheme();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed || isSearching) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setIsSearching(true);

    // Use setTimeout to allow the UI to update before the search runs
    setTimeout(() => {
      const response = ragSearch(trimmed);

      let responseText: string;
      if (response.hasResults) {
        const count = response.results.length;
        responseText =
          count === 1
            ? `Here's what I found about that:`
            : `Here are ${count} relevant sections I found:`;
      } else {
        responseText =
          "I couldn't find anything in the reference library that matches your question. Try rephrasing, or use the keyword search for broader results.";
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: responseText,
        response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsSearching(false);

      // Scroll to the bottom after the new message is added
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 0);
  }, [query, isSearching]);

  const handleJumpToEntry = useCallback(
    (entry: ReferenceEntryType) => {
      navigation.navigate('Entry', { entry });
    },
    [navigation],
  );

  const renderResultCard = useCallback(
    (result: { entry: ReferenceEntryType; excerpt: string }, index: number) => (
      <View
        key={result.entry.id}
        style={[
          styles.resultCard,
          {
            backgroundColor: COLORS.SECONDARY_ACCENT + '33',
            borderColor: COLORS.TOAST_BROWN,
          },
        ]}
      >
        <Text
          style={[styles.resultTitle, { color: COLORS.PRIMARY_DARK }]}
          numberOfLines={2}
        >
          {index + 1}. {result.entry.title}
        </Text>
        <Text style={[styles.resultCategory, { color: COLORS.PRIMARY_DARK }]}>
          {result.entry.category}
        </Text>
        <Text
          style={[styles.resultExcerpt, { color: COLORS.PRIMARY_DARK }]}
          numberOfLines={6}
        >
          {result.excerpt}
        </Text>
        <TouchableOpacity
          style={[styles.jumpButton, { backgroundColor: COLORS.TOAST_BROWN }]}
          onPress={() => handleJumpToEntry(result.entry)}
          accessibilityLabel={`Jump to full section: ${result.entry.title}`}
          accessibilityRole="button"
        >
          <Ionicons
            name="arrow-forward-circle-outline"
            size={16}
            color={COLORS.PRIMARY_LIGHT}
            style={styles.jumpIcon}
          />
          <Text
            style={[styles.jumpButtonText, { color: COLORS.PRIMARY_LIGHT }]}
          >
            Jump to full section
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [COLORS, handleJumpToEntry],
  );

  const renderMessage = useCallback(
    (message: Message) => {
      const isUser = message.role === 'user';

      return (
        <View
          key={message.id}
          style={[
            styles.messageRow,
            isUser ? styles.messageRowUser : styles.messageRowAssistant,
          ]}
        >
          {!isUser && (
            <View
              style={[
                styles.avatarBubble,
                { backgroundColor: COLORS.TOAST_BROWN },
              ]}
            >
              <Ionicons
                name="leaf-outline"
                size={14}
                color={COLORS.PRIMARY_LIGHT}
              />
            </View>
          )}
          <View style={styles.messageBubbleWrapper}>
            <View
              style={[
                styles.messageBubble,
                isUser
                  ? [styles.userBubble, { backgroundColor: COLORS.TOAST_BROWN }]
                  : [
                      styles.assistantBubble,
                      {
                        backgroundColor: COLORS.SECONDARY_ACCENT + '55',
                        borderColor: COLORS.TOAST_BROWN + '88',
                      },
                    ],
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  {
                    color: isUser ? COLORS.PRIMARY_LIGHT : COLORS.PRIMARY_DARK,
                  },
                ]}
              >
                {message.text}
              </Text>
            </View>

            {/* Result cards for assistant messages with results */}
            {!isUser &&
              message.response?.hasResults &&
              message.response.results.map((result, i) =>
                renderResultCard(result, i),
              )}
          </View>
        </View>
      );
    },
    [COLORS, renderResultCard],
  );

  return (
    <ScreenBody>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderColor: COLORS.TOAST_BROWN,
              backgroundColor: COLORS.SECONDARY_ACCENT,
            },
          ]}
        >
          <Ionicons
            name="leaf-outline"
            size={18}
            color={COLORS.PRIMARY_DARK}
            style={styles.headerIcon}
          />
          <Text style={[styles.headerTitle, { color: COLORS.PRIMARY_DARK }]}>
            Reference Assistant
          </Text>
          <View style={styles.offlineBadge}>
            <Ionicons
              name="airplane-outline"
              size={11}
              color={COLORS.PRIMARY_DARK}
            />
            <Text style={[styles.offlineText, { color: COLORS.PRIMARY_DARK }]}>
              Offline
            </Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: false })
          }
        >
          {messages.map(renderMessage)}

          {isSearching && (
            <View style={[styles.messageRow, styles.messageRowAssistant]}>
              <View
                style={[
                  styles.avatarBubble,
                  { backgroundColor: COLORS.TOAST_BROWN },
                ]}
              >
                <Ionicons
                  name="leaf-outline"
                  size={14}
                  color={COLORS.PRIMARY_LIGHT}
                />
              </View>
              <View
                style={[
                  styles.messageBubble,
                  styles.assistantBubble,
                  {
                    backgroundColor: COLORS.SECONDARY_ACCENT + '55',
                    borderColor: COLORS.TOAST_BROWN + '88',
                  },
                ]}
              >
                <ActivityIndicator
                  size="small"
                  color={COLORS.PRIMARY_DARK}
                  accessibilityLabel="Searching reference library"
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              borderColor: COLORS.TOAST_BROWN,
              backgroundColor: COLORS.SECONDARY_ACCENT,
            },
          ]}
        >
          <TextInput
            style={[styles.textInput, { color: COLORS.PRIMARY_DARK }]}
            placeholder="Ask a question…"
            placeholderTextColor={COLORS.PRIMARY_DARK + '80'}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline={false}
            editable={!isSearching}
            accessibilityLabel="Ask the reference assistant"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  query.trim().length > 0
                    ? COLORS.TOAST_BROWN
                    : COLORS.TOAST_BROWN + '44',
              },
            ]}
            onPress={handleSend}
            disabled={query.trim().length === 0 || isSearching}
            accessibilityLabel="Send question"
            accessibilityRole="button"
          >
            <Ionicons name="send" size={18} color={COLORS.PRIMARY_LIGHT} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    width: '100%',
    paddingBottom: FOOTER_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderRadius: 0,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  avatarBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
    flexShrink: 0,
  },
  messageBubbleWrapper: {
    flex: 1,
    maxWidth: '85%',
    gap: 6,
  },
  messageBubble: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    borderRadius: 12,
    alignSelf: 'flex-end',
    maxWidth: '100%',
  },
  assistantBubble: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  resultCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  resultCategory: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
    marginBottom: 4,
  },
  resultExcerpt: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.9,
  },
  jumpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  jumpIcon: {
    marginRight: 2,
  },
  jumpButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 2,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
