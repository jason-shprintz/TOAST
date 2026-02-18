/**
 * OfflineMapScreenContainer
 * Wrapper for OfflineMapScreen that provides navigation
 * @format
 */

import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import OfflineMapScreen from './OfflineMapScreen';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/**
 * Container component that provides navigation to OfflineMapScreen
 */
export default function OfflineMapScreenContainer() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const handleNavigateToDownload = useCallback(() => {
    navigation.navigate('DownloadOfflineRegion');
  }, [navigation]);

  return <OfflineMapScreen onNavigateToDownload={handleNavigateToDownload} />;
}
