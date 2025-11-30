import React from 'react';
import { View, Text } from 'react-native';

export default function SignalsModule() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: 'white' }}>Signals Module</Text>
    </View>
  );
}
