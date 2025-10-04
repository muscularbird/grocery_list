import { Swipeable } from 'react-native-gesture-handler';
import Feather from '@expo/vector-icons/Feather';
import { Text, View, TouchableOpacity, Pressable } from "react-native";
import { Item } from '@/app/main/home';

const renderItem = ({ item, drag, isActive }: {item: Item, drag: any, isActive: boolean}) => {
    const renderLeftActions = () => (
      <View>
        <Text>Edit</Text>
      </View>
    );

    const renderRightActions = () => (
      <View className='justify-center items-center m-4'>
        <Pressable onPress={() => console.log('Delete item', item.id)}>
          <Feather name="trash-2" size={30} color="red" />
        </Pressable>
      </View>
    );

    return (
      <Swipeable renderLeftActions={renderLeftActions} renderRightActions={renderRightActions}>
        <TouchableOpacity
          onLongPress={drag}
          className="w-full h-24 border-b border-gray-300 justify-center p-4"
          style={{ backgroundColor: isActive ? 'gray' : 'white' }}
        >
          <Text className="text-2xl">{item.name} x{item.quantity}</Text>
        </TouchableOpacity>
      </Swipeable>
    );
};

export default renderItem;