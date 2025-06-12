import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import MaskedView from "@react-native-masked-view/masked-view";
import { useColors } from "../../constants/Colors";

interface BlurGradientProps {
  position: "top" | "bottom";
  height?: number;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  backgroundColor?: string;
}

export const BlurGradient = ({
  position,
  height = 120,
  intensity = 25,
  tint = "light",
  backgroundColor,
}: BlurGradientProps) => {
  const theme = useColors();
  const bgColor = backgroundColor || theme?.background?.default || "#f5f5f5";

  // Define as cores do gradiente dependendo da posição (topo ou fundo)
  const colors =
    position === "top"
      ? [
          `${bgColor}FF`,
          `${bgColor}F8`,
          `${bgColor}F0`,
          `${bgColor}E0`,
          `${bgColor}D0`,
          `${bgColor}A0`,
          `${bgColor}70`,
          `${bgColor}40`,
          `${bgColor}10`,
          `${bgColor}00`,
        ]
      : [
          `${bgColor}00`,
          `${bgColor}10`,
          `${bgColor}40`,
          `${bgColor}70`,
          `${bgColor}A0`,
          `${bgColor}D0`,
          `${bgColor}E0`,
          `${bgColor}F0`,
          `${bgColor}F8`,
          `${bgColor}FF`,
        ];

  // Define as posições do gradiente
  const locations =
    position === "top"
      ? [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 0.9, 1]
      : [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

  return (
    <MaskedView
      style={[
        styles.gradientContainer,
        position === "top" ? { top: 0 } : { bottom: 0 },
        { height },
      ]}
      maskElement={
        <LinearGradient
          colors={colors}
          locations={locations}
          style={styles.maskGradient}
        />
      }
      pointerEvents="none"
    >
      <BlurView intensity={intensity} tint={tint} style={styles.blurView} />
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
  },
  maskGradient: {
    flex: 1,
  },
  blurView: {
    flex: 1,
  },
});
