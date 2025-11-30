import React from 'react';
import { View, Text } from 'react-native';

export default function CoreModule() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: 'white' }}>Core Module</Text>
    </View>
  );
}
