import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme';

export type PlaceholderCardProps = {
  title: string;
  icon: string; // Ionicons name
  onPress?: () => void;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
};

export default function PlaceholderCard({
  title,
  icon,
  onPress,
  containerStyle,
  titleStyle,
}: PlaceholderCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start(() => onPress && onPress());
  };

  return (
    <TouchableWithoutFeedback onPress={bounce}>
      <Animated.View
        style={[styles.card, { transform: [{ scale }] }, containerStyle]}
      >
        <Ionicons
          name={icon}
          size={40}
          color={COLORS.PRIMARY_DARK}
          style={styles.icon}
        />
        <Text style={[styles.title, titleStyle]}>{title}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    height: 130,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    elevation: 2,
    backgroundColor: COLORS.TOAST_BROWN,
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 2,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
  },
});
