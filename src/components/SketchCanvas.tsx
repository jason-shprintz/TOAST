import React, { useRef } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme';

interface SketchCanvasProps {
  onSketchSave: (dataUri: string) => void;
  initialSketch?: string;
}

/**
 * SketchCanvas component provides a drawing surface for creating sketch notes.
 *
 * Features:
 * - Drawing with touch input
 * - Clear/undo functionality
 * - Saves sketch as base64 data URI
 *
 * @param onSketchSave - Callback invoked with base64 data URI when sketch is saved
 * @param initialSketch - Optional base64 data URI to load an existing sketch
 * @returns A React element rendering the sketch canvas
 */
export default function SketchCanvas({
  onSketchSave,
  initialSketch,
}: SketchCanvasProps) {
  const ref = useRef<SignatureCanvas | null>(null);

  const handleOK = (signature: string) => {
    onSketchSave(signature);
  };

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleUndo = () => {
    ref.current?.undo();
  };

  // Web style for the canvas
  const webStyle = `.m-signature-pad {
    box-shadow: none;
    border: none;
    background-color: ${COLORS.PRIMARY_LIGHT};
  }
  .m-signature-pad--body {
    border: none;
  }
  .m-signature-pad--footer {
    display: none;
  }
  body,html {
    width: 100%;
    height: 100%;
  }`;

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolButton}
          onPress={handleUndo}
          accessibilityLabel="Undo last stroke"
          accessibilityRole="button"
        >
          <Icon name="arrow-undo-outline" size={24} color={COLORS.PRIMARY_DARK} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolButton}
          onPress={handleClear}
          accessibilityLabel="Clear sketch"
          accessibilityRole="button"
        >
          <Icon name="trash-outline" size={24} color={COLORS.PRIMARY_DARK} />
        </TouchableOpacity>
      </View>
      <View style={styles.canvasContainer}>
        <SignatureCanvas
          ref={ref}
          onOK={handleOK}
          descriptionText=""
          webStyle={webStyle}
          backgroundColor={COLORS.PRIMARY_LIGHT}
          penColor={COLORS.PRIMARY_DARK}
          dataURL={initialSketch}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.TOAST_BROWN,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SECONDARY_ACCENT,
    gap: 8,
  },
  toolButton: {
    padding: 8,
  },
  canvasContainer: {
    flex: 1,
  },
});
