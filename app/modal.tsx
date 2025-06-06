import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Modal,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef } from "react";
import { useMap } from "../context/MapContext";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useColors } from "../constants/Colors";
import { useHaptics } from "../hooks/useHaptics";
import * as Haptics from "expo-haptics";
import api from "../services/api";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import React from "react";

const { width } = Dimensions.get("window");

export default function ModalScreen() {
  const theme = useColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addMarker, markers, removeMarker, loadMarkers } = useMap();
  const { impactAsync, notificationAsync } = useHaptics();

  const [title, setTitle] = useState((params.title as string) || "");
  const [description, setDescription] = useState(
    (params.description as string) || ""
  );
  const [address, setAddress] = useState((params.address as string) || "");
  const [image, setImage] = useState<string | null>(
    (params.image as string) || null
  );
  const [visitedAt, setVisitedAt] = useState<Date | null>(
    params.visitedAt ? new Date(params.visitedAt as string) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isEditing = params.isEditing === "true";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const scrollViewRef = useRef<ScrollView | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  const datePickerAnim = useRef(new Animated.Value(0)).current;
  const datePickerScale = useRef(new Animated.Value(0.8)).current;
  const datePickerOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animations = [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
      ]),
    ];

    Animated.stagger(100, animations).start();
  }, []);

  const pickImage = async () => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleConfirm = async () => {
    if (!title.trim() || !description.trim()) {
      impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setError("Título e descrição são obrigatórios");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (isEditing && params.markerId) {
        const markerRef = doc(db, "markers", params.markerId as string);
        await updateDoc(markerRef, {
          title,
          description,
          image,
          visitedAt,
          isFavorite: false,
        });

        await loadMarkers();
        notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        await addMarker({
          coordinate: {
            latitude: Number(params.latitude),
            longitude: Number(params.longitude),
          },
          title,
          description,
          address: address || (params.address as string),
          image,
          visitedAt,
          createdAt: new Date(),
        });
        notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch (err: any) {
      impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setError(err.message || "Erro ao salvar marcador");
    } finally {
      setIsLoading(false);
    }
  };

  const openDatePicker = () => {
    setTempDate(visitedAt || new Date());
    setShowDatePicker(true);
    Animated.parallel([
      Animated.timing(datePickerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.timing(datePickerScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.timing(datePickerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDatePicker = () => {
    Animated.parallel([
      Animated.timing(datePickerAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.timing(datePickerScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.timing(datePickerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDatePicker(false);
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleConfirmDate = () => {
    if (tempDate) {
      impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setVisitedAt(tempDate);
      closeDatePicker();
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background.default }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[
          styles.container,
          { backgroundColor: theme.background.default },
        ]}
      >
        <LinearGradient
          colors={[
            theme.background.default,
            theme.background.paper,
            theme.background.default,
          ]}
          style={styles.gradient}
        >
          <Animated.View
            style={[
              styles.header,
              {
                backgroundColor: theme.background.default,
                borderBottomColor: theme.border.light,
                opacity: headerAnim,
                transform: [
                  {
                    scale: headerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View
                style={[
                  styles.backButtonContainer,
                  { backgroundColor: theme.primary.main },
                ]}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text.primary }]}>
              {isEditing ? "Editar Xubi" : "Novo Xubi"}
            </Text>
          </Animated.View>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEnabled={!isLoading}
              keyboardDismissMode="on-drag"
              ref={scrollViewRef}
            >
              {error && (
                <Animated.View
                  style={[
                    styles.errorContainer,
                    {
                      backgroundColor: theme.error.main + "20",
                      opacity: fadeAnim,
                      transform: [
                        {
                          scale: scaleAnim,
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={[styles.errorText, { color: theme.error.main }]}>
                    {error}
                  </Text>
                </Animated.View>
              )}

              <Animated.View
                style={[
                  styles.content,
                  {
                    opacity: contentAnim,
                    transform: [
                      {
                        scale: contentAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.95, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.imageContainer,
                    {
                      borderColor: theme.primary.main,
                      backgroundColor: theme.background.paper,
                    },
                  ]}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholderContainer}>
                      <Ionicons
                        name="camera"
                        size={40}
                        color={theme.text.secondary}
                      />
                      <Text
                        style={[
                          styles.imagePlaceholder,
                          { color: theme.text.secondary },
                        ]}
                      >
                        Adicionar Foto
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Input
                  placeholder="Endereço"
                  value={address}
                  onChangeText={setAddress}
                  icon="map-marker"
                  blurOnSubmit={false}
                />

                <Input
                  placeholder="Título"
                  value={title}
                  onChangeText={setTitle}
                  icon="heart"
                  blurOnSubmit={false}
                />

                <Input
                  placeholder="Escreva uma mensagem especial..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  icon="message-text"
                  blurOnSubmit={false}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({
                        y: 300,
                        animated: true,
                      });
                    }, 100);
                  }}
                />

                <TouchableOpacity
                  onPress={openDatePicker}
                  style={styles.dateButton}
                >
                  <Input
                    placeholder="Adicionar data especial (opcional)"
                    value={
                      visitedAt ? visitedAt.toLocaleDateString("pt-BR") : ""
                    }
                    editable={false}
                    icon="calendar"
                    onPressIn={openDatePicker}
                  />
                </TouchableOpacity>

                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="none"
                  onRequestClose={closeDatePicker}
                >
                  <TouchableWithoutFeedback onPress={closeDatePicker}>
                    <Animated.View
                      style={[
                        styles.datePickerOverlay,
                        {
                          opacity: datePickerOpacity,
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                        },
                      ]}
                    >
                      <TouchableWithoutFeedback>
                        <Animated.View
                          style={[
                            styles.datePickerContainer,
                            {
                              transform: [
                                { scale: datePickerScale },
                                {
                                  translateY: datePickerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                  }),
                                },
                              ],
                              backgroundColor: theme.background.paper,
                            },
                          ]}
                        >
                          <View style={styles.datePickerHeader}>
                            <Text
                              style={[
                                styles.datePickerTitle,
                                { color: theme.text.primary },
                              ]}
                            >
                              Escolha uma data especial
                            </Text>
                            <TouchableOpacity
                              onPress={closeDatePicker}
                              style={styles.datePickerCloseButton}
                            >
                              <Ionicons
                                name="close"
                                size={24}
                                color={theme.text.secondary}
                              />
                            </TouchableOpacity>
                          </View>

                          <DateTimePicker
                            value={tempDate || new Date()}
                            mode="date"
                            display="spinner"
                            onChange={handleDateChange}
                            locale="pt-BR"
                            style={styles.datePicker}
                            maximumDate={new Date()}
                            minimumDate={new Date(1900, 0, 1)}
                          />

                          <View style={styles.datePickerFooter}>
                            <Button
                              title="Cancelar"
                              variant="error"
                              outline
                              onPress={closeDatePicker}
                              style={styles.datePickerButton}
                            />
                            <Button
                              title="Confirmar"
                              variant="primary"
                              onPress={handleConfirmDate}
                              style={styles.datePickerButton}
                            />
                          </View>
                        </Animated.View>
                      </TouchableWithoutFeedback>
                    </Animated.View>
                  </TouchableWithoutFeedback>
                </Modal>
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </LinearGradient>
      </KeyboardAvoidingView>

      <Animated.View
        style={[
          styles.footer,
          {
            backgroundColor: theme.background.default,
            borderTopColor: theme.border.light,
            opacity: footerAnim,
            transform: [
              {
                scale: footerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Button
          title="Cancelar"
          variant="error"
          outline
          onPress={() => router.back()}
          style={styles.footerButton}
          disabled={isLoading}
        />

        <Button
          title={isEditing ? "Salvar" : "Criar Xubi"}
          variant="primary"
          onPress={handleConfirm}
          style={styles.footerButton}
          loading={isLoading}
          disabled={isLoading}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    position: "absolute",
    left: 16,
    zIndex: 2,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingTop: 16,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: 24,
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderStyle: "dashed",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholderContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholder: {
    fontSize: 16,
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  dateButton: {},
  datePickerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  datePickerContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  datePickerTitle: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  datePickerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  datePicker: {
    height: 220,
    marginVertical: 8,
  },
  datePickerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  datePickerButton: {
    flex: 1,
    marginHorizontal: 8,
    height: 48,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
});
