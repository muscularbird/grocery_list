import { Swipeable } from 'react-native-gesture-handler';
import Feather from '@expo/vector-icons/Feather';
import { Text, View, TouchableOpacity, Pressable } from "react-native";
import { Item } from '@/app/main/home';
import { supabase } from '@/utils/supabase';

const renderItem = ({ item, drag, isActive, setItems, itemId, setItemId }: {item: Item, drag: any, isActive: boolean, setItems: Function, itemId: number, setItemId: Function}) => {
    const deleteItem = (id: number) => {
        console.log('Delete item', id);
        supabase.from('items').delete().eq('id', id).then(({ error }) => {
            if (error) {
            console.error('Error deleting item:', error.message);
            } else {
            console.log('Item deleted successfully');
            setItems((items: Item[]) => items.filter((item) => item.id !== id));
            }
        });
    }

    const editItem = (id: number) => {
        console.log('Edit item', id);
        setItemId(id);
    }

    const renderLeftActions = () => (
      <View className='justify-center items-center m-4'>
        <Pressable onPress={() => editItem(item.id)}>
            <Feather name="edit-2" size={30} color="#fcba03" />
        </Pressable>
      </View>
    );

    const renderRightActions = () => (
      <View className='justify-center items-center m-4'>
        <Pressable onPress={() => deleteItem(item.id)}>
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