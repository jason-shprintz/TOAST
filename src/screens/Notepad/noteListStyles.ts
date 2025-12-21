import { StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

export const noteListSharedStyles = StyleSheet.create({
  value: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
    padding: 10,
  },
  itemRow: {
    paddingVertical: 8,
    borderBottomColor: COLORS.SECONDARY_ACCENT,
    borderBottomWidth: 1,
    borderRadius: 12,
  },
  itemTitle: {
    fontSize: 16,
    color: COLORS.PRIMARY_DARK,
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.8,
    marginTop: 2,
    paddingHorizontal: 10,
  },
  itemBody: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  itemBodyExpanded: {
    fontSize: 14,
    color: COLORS.PRIMARY_DARK,
    marginTop: 6,
    paddingHorizontal: 20,
    height: 150,
  },
  moreHint: {
    fontSize: 12,
    color: COLORS.PRIMARY_DARK,
    opacity: 0.7,
    marginTop: 4,
    paddingHorizontal: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  trashButton: {
    padding: 4,
  },
});
