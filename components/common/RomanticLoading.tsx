import React, { useEffect } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "../../constants/Colors";

export const RomanticLoading = () => {
  const theme = useColors();
  const scaleAnim = new Animated.Value(1);
  const opacityAnim = new Animated.Value(1);

  useEffect(() => {
    const startAnimation = () => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => startAnimation());
    };

    startAnimation();
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background.default }]}
    >
      <Animated.View
        style={[
          styles.heartWrapper,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="heart"
          size={50}
          color={theme.primary.main}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heartWrapper: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
