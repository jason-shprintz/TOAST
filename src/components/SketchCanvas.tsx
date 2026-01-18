import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { COLORS } from '../theme';

interface SketchCanvasProps {
  onSketchSave: (dataUri: string) => void;
  initialSketch?: string;
  onClear?: () => void;
  onBegin?: () => void;
}

export interface SketchCanvasHandle {
  readSignature: () => void;
  clearSignature: () => void;
  undo: () => void;
}

/**
 * SketchCanvas component provides a drawing surface for creating sketch notes.
 *
 * Features:
 * - Drawing with touch input
 * - Clear/undo functionality via exposed methods
 * - Saves sketch as base64 data URI
 *
 * @param onSketchSave - Callback invoked with base64 data URI when sketch is saved
 * @param initialSketch - Optional base64 data URI to load an existing sketch
 * @param onClear - Optional callback when clear button is pressed
 * @param onBegin - Optional callback when user starts drawing
 * @returns A React element rendering the sketch canvas
 */
const SketchCanvas = forwardRef<SketchCanvasHandle, SketchCanvasProps>(
  ({ onSketchSave, initialSketch, onClear, onBegin }, forwardedRef) => {
    const ref = useRef<SignatureCanvas | null>(null);

    useImperativeHandle(forwardedRef, () => ({
      readSignature: () => {
        ref.current?.readSignature();
      },
      clearSignature: () => {
        ref.current?.clearSignature();
        if (onClear) {
          onClear();
        }
      },
      undo: () => {
        ref.current?.undo();
      },
    }));

    const handleOK = (signature: string) => {
      onSketchSave(signature);
    };

    const handleBegin = () => {
      if (onBegin) {
        onBegin();
      }
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
      <View style={styles.container} collapsable={false}>
        <SignatureCanvas
          ref={ref}
          onOK={handleOK}
          onBegin={handleBegin}
          descriptionText=""
          webStyle={webStyle}
          backgroundColor={COLORS.PRIMARY_LIGHT}
          penColor={COLORS.PRIMARY_DARK}
          dataURL={initialSketch}
          webviewContainerStyle={styles.webviewContainer}
          scrollEnabled={false}
        />
      </View>
    );
  }
);

SketchCanvas.displayName = 'SketchCanvas';

export default SketchCanvas;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.SECONDARY_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  webviewContainer: {
    flex: 1,
  },
});
