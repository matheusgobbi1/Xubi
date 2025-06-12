import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  useSharedValue,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useColors } from "../../constants/Colors";

const { width, height } = Dimensions.get("window");

export const LoveMessage = () => {
  const theme = useColors();
  const [fontsLoaded] = useFonts({
    Italiano: require("../../assets/fonts/Italianno-Regular.ttf"),
  });

  const [isModalVisible, setIsModalVisible] = useState(false);

  // Valores animados
  const heartScale = useSharedValue(1);
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const modalRotate = useSharedValue(0);
  const pageFlip = useSharedValue(0);
  const envelopeOpen = useSharedValue(0);
  const foldProgress = useSharedValue(0);
  const letterRise = useSharedValue(0);
  const signatureOpacity = useSharedValue(1);

  // Estilos animados
  const heartStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: heartScale.value }],
    };
  });

  const modalStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
      transform: [
        { scale: modalScale.value },
        { perspective: 1000 },
        { rotateY: `${interpolate(modalRotate.value, [0, 1], [20, 0])}deg` },
      ],
    };
  });

  const letterOpenStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${interpolate(pageFlip.value, [0, 1], [-90, 0])}deg` },
        { translateY: interpolate(pageFlip.value, [0, 1], [-20, 0]) },
      ],
      opacity: interpolate(pageFlip.value, [0, 0.3, 1], [0, 0.7, 1]),
      backgroundColor: "#fff9f0",
    };
  });

  const letterBackStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${interpolate(pageFlip.value, [0, 1], [-90, 0])}deg` },
        { translateY: interpolate(pageFlip.value, [0, 1], [-20, 0]) },
      ],
      opacity: interpolate(pageFlip.value, [0, 0.3, 1], [1, 0.7, 0]),
      backgroundColor: "#fff9f0",
    };
  });

  const foldStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotateX: `${interpolate(
            foldProgress.value,
            [0, 1],
            [0, -90],
            Extrapolate.CLAMP
          )}deg`,
        },
        {
          translateY: interpolate(
            foldProgress.value,
            [0, 1],
            [0, -50],
            Extrapolate.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        foldProgress.value,
        [0, 0.7, 1],
        [1, 0.5, 0],
        Extrapolate.CLAMP
      ),
    };
  });

  const letterSealStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        envelopeOpen.value,
        [0, 0.3, 0.5],
        [1, 0.7, 0],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            envelopeOpen.value,
            [0, 0.5],
            [1, 0.8],
            Extrapolate.CLAMP
          ),
        },
        {
          translateY: interpolate(
            envelopeOpen.value,
            [0, 0.5],
            [0, -10],
            Extrapolate.CLAMP
          ),
        },
      ],
      position: "absolute",
      top: "50%",
      left: "50%",
      width: 80,
      height: 80,
      marginLeft: -40,
      marginTop: -40,
      zIndex: 4,
    };
  });

  const letterContentStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            letterRise.value,
            [0, 1],
            [0, -80],
            Extrapolate.CLAMP
          ),
        },
      ],
      opacity: letterRise.value,
    };
  });

  const signatureStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        envelopeOpen.value,
        [0, 0.3],
        [1, 0],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          translateY: interpolate(
            envelopeOpen.value,
            [0, 0.3],
            [0, -10],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const showModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleHeartPress = () => {
    // Sequência de animação para abrir o envelope
    envelopeOpen.value = withTiming(1, { duration: 400 });
    signatureOpacity.value = withTiming(0, { duration: 200 });
    heartScale.value = withSequence(
      withTiming(1.1, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );

    // Animar a dobra do envelope
    foldProgress.value = withTiming(1, { duration: 400 }, () => {
      // Animar a carta subindo
      letterRise.value = withTiming(1, { duration: 300 }, (finished) => {
        if (finished) {
          // Resetar as animações ao mostrar o modal
          runOnJS(showModal)();
          modalOpacity.value = withTiming(1, { duration: 300 });
          modalScale.value = withSpring(1);
          modalRotate.value = withTiming(1, { duration: 600 });
          pageFlip.value = withTiming(1, { duration: 800 });
        }
      });
    });
  };

  const handleCloseModal = () => {
    pageFlip.value = withTiming(0, { duration: 400 });
    modalRotate.value = withTiming(0, { duration: 300 });
    modalOpacity.value = withTiming(0, { duration: 300 });
    modalScale.value = withTiming(0.8, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(hideModal)();
        // Resetar as animações ao fechar o modal de forma segura
        envelopeOpen.value = 0;
        foldProgress.value = 0;
        letterRise.value = 0;
        signatureOpacity.value = 1;
      }
    });
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <Pressable style={styles.loveCardContainer} onPress={handleHeartPress}>
          <LinearGradient
            colors={["#FF758C", "#FF7EB3"]}
            style={styles.loveCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Triângulo simulando dobra da carta */}
            <View style={styles.letterFold} />
            <View style={styles.letterFoldInner} />

            <View style={styles.loveCardContent}>
              <Animated.View style={[styles.heartIcon, heartStyle]}>
                <MaterialCommunityIcons
                  name="heart"
                  size={32}
                  color="#fff"
                  style={{ textShadowOffset: { width: 1, height: 1 } }}
                />
              </Animated.View>
              <Text style={styles.loveCardTitle}>Mensagem</Text>
              <Text style={styles.loveCardSubtitle}>Para Xubi</Text>
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
            <Animated.View style={[styles.modalContent, modalStyle]}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.letterContainer}>
                  {/* Parte de trás da carta */}
                  <Animated.View style={[styles.letterBack, letterBackStyle]} />

                  {/* Carta aberta */}
                  <Animated.View style={[styles.letterOpen, letterOpenStyle]}>
                    <LinearGradient
                      colors={["#FF758C", "#FF7EB3"]}
                      style={styles.letterGradient}
                    >
                      <View style={styles.paperTexture}>
                        <View style={styles.decorativeCornerTopLeft} />
                        <View style={styles.decorativeCornerTopRight} />
                        <View style={styles.decorativeCornerBottomLeft} />
                        <View style={styles.decorativeCornerBottomRight} />
                        <View style={styles.modalHeader}>
                          <Text style={styles.modalTitle}>Oi gatinha</Text>
                          <MaterialCommunityIcons
                            name="heart"
                            size={32}
                            color="#fff"
                          />
                        </View>

                        <View style={styles.letterContent}>
                          <View style={styles.decorativeLineTop} />
                          <Text style={styles.letterText}>
                            AQUI VAI SER O TEXTO
                          </Text>
                          <View style={styles.decorativeLine} />
                          <Text style={styles.letterSignature}>
                            Mais que te amo, até depois do fim.
                          </Text>
                          <Text style={styles.letterName}>Xubi</Text>

                          <View style={styles.heartBackground}>
                            <MaterialCommunityIcons
                              name="heart"
                              size={60}
                              color="rgba(255,255,255,0.2)"
                              style={styles.backgroundHeart1}
                            />
                            <MaterialCommunityIcons
                              name="heart"
                              size={40}
                              color="rgba(255,255,255,0.15)"
                              style={styles.backgroundHeart2}
                            />
                            <MaterialCommunityIcons
                              name="heart"
                              size={30}
                              color="rgba(255,255,255,0.2)"
                              style={styles.backgroundHeart3}
                            />
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </BlurView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  loveCardContainer: {
    width: "100%",
    height: 200,
    borderRadius: 4,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 30,
    perspective: "1000px",
  },
  loveCard: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  letterFold: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderTopWidth: 100,
    borderLeftWidth: 150,
    borderRightWidth: 150,
    borderTopColor: "rgba(255,255,255,0.3)",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    zIndex: 2,
  },
  letterFoldInner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderTopWidth: 80,
    borderLeftWidth: 130,
    borderRightWidth: 130,
    borderTopColor: "rgba(255,255,255,0.15)",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    zIndex: 3,
  },
  loveCardContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heartIcon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  loveCardTitle: {
    fontSize: 32,
    fontFamily: "Italiano",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loveCardSubtitle: {
    fontSize: 18,
    fontFamily: "Italiano",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  shadowContainer: {
    width: "100%",
    height: 200,
    borderRadius: 4,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 30,
    perspective: "1000px",
  },
  letterContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "transparent",
    position: "relative",
  },
  letterBackground: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.85,
    maxWidth: 400,
    height: height * 0.85,
    maxHeight: 700,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderRadius: 8,
    backgroundColor: "#fff9f0",
  },
  letterBack: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff9f0",
    backfaceVisibility: "hidden",
  },
  letterOpen: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff9f0",
    borderRadius: 8,
    overflow: "hidden",
    backfaceVisibility: "hidden",
  },
  letterGradient: {
    flex: 1,
    padding: 0,
  },
  paperTexture: {
    flex: 1,
    padding: 24,
    position: "relative",
    backgroundColor: "transparent",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 40,
    fontFamily: "Italiano",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 0,
    marginTop: -8,
  },
  letterContent: {
    paddingVertical: 16,
    paddingBottom: 24,
    position: "relative",
    flex: 1,
  },
  letterText: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: "italic",
    textAlign: "left",
  },
  decorativeLine: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginVertical: 4,
    width: "100%",
    alignSelf: "center",
  },
  letterSignature: {
    fontSize: 18,
    color: "#fff",
    fontStyle: "italic",
    marginBottom: 8,
    textAlign: "right",
  },
  letterName: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "Italiano",
    textAlign: "right",
  },
  signatureContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
  },
  signatureContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  signatureText: {
    fontFamily: "Italiano",
    fontSize: 22,
    color: "#8B4513",
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  signatureLeft: {
    marginLeft: 15,
  },
  signatureRight: {
    marginRight: 15,
  },
  cornerDecoration: {
    display: "none",
  },
  cornerDecorationRight: {
    display: "none",
  },
  cornerDecorationBottom: {
    display: "none",
  },
  cornerDecorationBottomRight: {
    display: "none",
  },
  decorativeLineTop: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginBottom: 16,
    width: "100%",
    alignSelf: "center",
  },
  waxSeal: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(139,69,19,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(139,69,19,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  decorativeCornerTopLeft: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  decorativeCornerTopRight: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  decorativeCornerBottomLeft: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  decorativeCornerBottomRight: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heartBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  backgroundHeart1: {
    position: "absolute",
    top: "20%",
    right: "10%",
  },
  backgroundHeart2: {
    position: "absolute",
    bottom: "30%",
    left: "15%",
  },
  backgroundHeart3: {
    position: "absolute",
    top: "60%",
    right: "25%",
  },
});
