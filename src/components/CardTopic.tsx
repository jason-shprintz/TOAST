import React, { useRef } from 'react';
import {
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme';
import { Text } from './ScaledText';

export type CardTopicProps = {
  title: string;
  icon: string; // icon name
  onPress?: () => void;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  IconComponent?: React.ComponentType<any>;
};

/**
 * A card component that displays an icon and a title, with a bounce animation on press.
 *
 * @param title - The text to display as the card's title.
 * @param icon - The name of the Ionicons icon to display.
 * @param onPress - Optional callback function to execute when the card is pressed.
 * @param containerStyle - Optional style overrides for the card container.
 * @param titleStyle - Optional style overrides for the title text.
 *
 * The card animates with a bounce effect when pressed, and then triggers the `onPress` callback if provided.
 */
export default function CardTopic({
  title,
  icon,
  onPress,
  containerStyle,
  titleStyle,
  IconComponent = Ionicons,
}: CardTopicProps) {
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
        <LinearGradient
          colors={COLORS.TOAST_BROWN_GRADIENT}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.background}
        />
        <IconComponent
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
    width: '40%',
    minWidth: 150,
    height: 130,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    elevation: 2,
    overflow: 'hidden',
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 2,
    boxShadow: '0 0 5px ' + COLORS.SECONDARY_ACCENT,
  },
  background: {
    ...StyleSheet.absoluteFill,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.PRIMARY_DARK,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
});
