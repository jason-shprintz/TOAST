import { StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

export const noteListSharedStyles = StyleSheet.create({
  value: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
  },
  itemRow: {
    paddingVertical: 8,
    borderBottomColor: COLORS.SECONDARY_ACCENT,
    borderBottomWidth: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
    fontWeight: '600',
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.8,
    marginTop: 2,
  },
  itemBody: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginTop: 6,
  },
  itemBodyExpanded: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginTop: 6,
  },
  moreHint: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  trashButton: {
    padding: 4,
  },
});
