/**
 * @module NotificationsScreen
 * @description Full notification history list.
 *              Unread items: teal left border + bold title.
 *              Auto-marks all as read after 2 seconds on screen open.
 *              "Mark all read" link in header.
 *              Called by: MainNavigator (pushed via bell icon, not a tab).
 */

import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import useNotificationStore from '../../store/notificationStore.js';
import { EmptyState }       from '../../components/common/CommonComponents.jsx';
import { colors }    from '../../theme/colors.js';
import { typography }from '../../theme/typography.js';
import { spacing }   from '../../theme/spacing.js';
import { formatTimeAgo } from '../../utils/formatters.js';
import { NOTIFICATION_TYPES } from '../../utils/constants.js';

const TYPE_ICONS = {
  leave_approved:            '✅',
  leave_rejected:            '❌',
  regularisation_approved:   '✅',
  regularisation_rejected:   '❌',
  checkin_reminder:          '⏰',
  checkout_reminder:         '⏰',
  general:                   '📢',
};

const NotificationItem = ({ item, onPress }) => {
  const icon = TYPE_ICONS[item.type] || '📢';

  return (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      {/* Unread indicator */}
      {!item.isRead && <View style={styles.unreadBar} />}

      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleUnread]}
          numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.itemTime}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const NotificationsScreen = ({ navigation }) => {
  const notifications  = useNotificationStore((s) => s.notifications);
  const isLoading      = useNotificationStore((s) => s.isLoading);
  const hasMore        = useNotificationStore((s) => s.hasMore);
  const loadMore       = useNotificationStore((s) => s.loadNotifications);
  const markAsRead     = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead  = useNotificationStore((s) => s.markAllAsRead);

  useEffect(() => {
    loadMore(true);
    // Auto-mark all read after 2 seconds
    const timer = setTimeout(() => markAllAsRead(), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleItemPress = (item) => {
    markAsRead(item.id);
    // Navigate to relevant screen based on type
    if (item.actionUrl) {
      // Deep link handling would go here
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) loadMore(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Mark all read link */}
      <View style={styles.header}>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={handleItemPress} />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isLoading && (
            <EmptyState
              emoji="🔔"
              title="No notifications yet"
              subtitle="Attendance reminders and approvals will appear here"
            />
          )
        }
        ListFooterComponent={
          isLoading && (
            <ActivityIndicator color={colors.accent} style={{ margin: spacing.xl }} />
          )
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },

  header: {
    alignItems:      'flex-end',
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor:   colors.bgSurface,
  },
  markAllText: {
    fontFamily: typography.fontMedium,
    fontSize:   typography.sm,
    color:      colors.accent,
  },

  item: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: colors.bgSurface,
    marginHorizontal: spacing.base,
    marginTop:       spacing.sm,
    borderRadius:    14,
    padding:         spacing.base,
    overflow:        'hidden',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    6,
    elevation:       1,
  },
  itemUnread: {
    backgroundColor: colors.accentLight,
  },
  unreadBar: {
    position:        'absolute',
    left:            0,
    top:             0,
    bottom:          0,
    width:           4,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },

  iconWrap: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: colors.bgSubtle,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     spacing.sm,
  },
  icon: { fontSize: 20 },

  textBlock: { flex: 1 },
  itemTitle: {
    fontFamily:   typography.fontMedium,
    fontSize:     typography.base,
    color:        colors.textPrimary,
    marginBottom: 2,
  },
  itemTitleUnread: { fontFamily: typography.fontSemiBold },
  itemBody: {
    fontFamily:   typography.fontRegular,
    fontSize:     typography.sm,
    color:        colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight:   typography.sm * typography.normal,
  },
  itemTime: {
    fontFamily: typography.fontMono,
    fontSize:   typography.xs,
    color:      colors.textMuted,
  },
});

export default NotificationsScreen;
