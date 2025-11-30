import React from 'react';
import { View, Text } from 'react-native';

export default function NavigationModule() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: 'white' }}>Navigation Module</Text>
    </View>
  );
}
