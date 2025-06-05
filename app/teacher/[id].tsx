import { Stack, useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function TeacherDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: `Docente ${id}` }} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Detalle del docente (id = {id})</Text>
      </View>
    </>
  );
}
