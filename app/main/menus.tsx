import AsyncStorage from '@react-native-async-storage/async-storage'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { supabase } from '@/utils/supabase'
import showToast from '@/utils/showToast'

type Dish = {
	id: string
	name: string
	ingredients: string[]
}

const DISHES_STORAGE_KEY = '@grocery-list/dishes'

export default function Menus() {
	const [dishes, setDishes] = useState<Dish[]>([])
	const [dishName, setDishName] = useState('')
	const [ingredientName, setIngredientName] = useState('')
	const [ingredients, setIngredients] = useState<string[]>([])
	const [editingDishId, setEditingDishId] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		AsyncStorage.getItem(DISHES_STORAGE_KEY).then((storedDishes) => {
			if (storedDishes) {
				setDishes(JSON.parse(storedDishes))
			}
		})
	}, [])

	const persistDishes = async (nextDishes: Dish[]) => {
		setDishes(nextDishes)
		await AsyncStorage.setItem(DISHES_STORAGE_KEY, JSON.stringify(nextDishes))
	}

	const addIngredient = () => {
		const nextIngredient = ingredientName.trim()
		if (!nextIngredient) return

		setIngredients((currentIngredients) => [...currentIngredients, nextIngredient])
		setIngredientName('')
	}

	const createDish = async () => {
		const name = dishName.trim()
		if (!name || ingredients.length === 0) {
			Alert.alert('Complete your dish', 'Add a dish name and at least one ingredient.')
			return
		}

		const nextDishes = editingDishId
			? dishes.map((dish) => dish.id === editingDishId ? { ...dish, name, ingredients } : dish)
			: [...dishes, { id: `${Date.now()}`, name, ingredients }]
		await persistDishes(nextDishes)
		setDishName('')
		setIngredients([])
		setEditingDishId(null)
		showToast('success', editingDishId ? 'Dish updated' : 'Dish saved', `${name} is ready in your dishes.`)
	}

	const editDish = (dish: Dish) => {
		setEditingDishId(dish.id)
		setDishName(dish.name)
		setIngredients([...dish.ingredients])
	}

	const cancelEditing = () => {
		setEditingDishId(null)
		setDishName('')
		setIngredients([])
	}

	const deleteDish = (dish: Dish) => {
		Alert.alert(
			`Delete ${dish.name}?`,
			'This dish will be removed from your saved dishes.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						await persistDishes(dishes.filter((currentDish) => currentDish.id !== dish.id))
						if (editingDishId === dish.id) cancelEditing()
					},
				},
			],
		)
	}

	const addDishToGroceryList = async (dish: Dish) => {
		setSaving(true)
		try {
			const { data: { user } } = await supabase.auth.getUser()
			if (!user) {
				showToast('error', 'Error', 'You must be signed in to add ingredients.')
				return
			}

			const { error } = await supabase.from('items').insert(
				dish.ingredients.map((name) => ({
					name,
					quantity: 1,
					purchased: false,
					user_id: user.id,
				})),
			)

			if (error) {
				showToast('error', 'Error', error.message)
				return
			}

			showToast('success', 'Ingredients added', `${dish.name} is now on your grocery list.`)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unable to add ingredients.'
			showToast('error', 'Error', message)
		} finally {
			setSaving(false)
		}
	}

	return (
		<KeyboardAvoidingView
			className="flex-1 bg-background"
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
		>
			<ScrollView
				className="flex-1"
				contentContainerClassName="px-5 pb-28 pt-6"
				keyboardShouldPersistTaps="handled"
			>
				<Text className="text-3xl font-bold text-foreground">Plats</Text>

				<View className="rounded-2xl border border-border bg-card p-4 mt-4">
					<View className="mb-3 flex-row items-center justify-between">
						<Text className="text-lg font-bold text-cardForeground">{editingDishId ? 'Editer le plat' : 'Créer un plat'}</Text>
						{editingDishId ? (
							<Pressable onPress={cancelEditing}>
								<Text className="font-semibold text-primary">Annuler</Text>
							</Pressable>
						) : null}
					</View>
					<TextInput
						className="mb-4 rounded-xl border border-border bg-input px-4 py-3 text-foreground"
						placeholder="Nom du plat"
						placeholderTextColor="#94A3B8"
						value={dishName}
						onChangeText={setDishName}
					/>
					<View className="mb-3 flex-row items-center gap-2">
						<TextInput
							className="min-w-0 flex-1 rounded-xl border border-border bg-input px-4 py-3 text-foreground"
							placeholder="Ajouter un ingrédient"
							placeholderTextColor="#94A3B8"
							value={ingredientName}
							onChangeText={setIngredientName}
							onSubmitEditing={addIngredient}
							returnKeyType="done"
						/>
						<Pressable
							className="h-12 w-12 items-center justify-center rounded-xl bg-secondary active:opacity-70"
							onPress={addIngredient}
							accessibilityLabel="Ajouter l'ingrédient"
						>
							<MaterialIcons name="add" size={24} color="#60A5FA" />
						</Pressable>
					</View>

					{ingredients.length > 0 ? (
						<View className="mb-4 gap-2">
							{ingredients.map((ingredient, index) => (
								<View key={`${ingredient}-${index}`} className="flex-row items-center justify-between rounded-lg bg-backgroundSecondary px-3 py-2">
									<Text className="flex-1 text-foreground">{ingredient}</Text>
									<Pressable
										onPress={() => setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))}
										accessibilityLabel={`Enlever ${ingredient}`}
									>
										<MaterialIcons name="close" size={20} color="#94A3B8" />
									</Pressable>
								</View>
							))}
						</View>
					) : (
						<Text className="mb-4 text-sm text-foregroundMuted">Vos ingrédients apparaîtront ici.</Text>
					)}

					<Pressable
						className="items-center rounded-xl bg-primary px-4 py-3 active:opacity-80"
						onPress={createDish}
					>
						<Text className="font-bold text-primaryForeground">{editingDishId ? 'Editer le plat' : 'Sauvegarder le plat'}</Text>
					</Pressable>
				</View>

				<Text className="mb-3 mt-8 text-lg font-bold text-foreground">Vos plats</Text>
				{dishes.length === 0 ? (
					<View className="rounded-2xl border border-dashed border-border px-5 py-8">
						<Text className="text-center text-foregroundMuted">Vos plats apparaîtront ici.</Text>
					</View>
				) : (
					<View className="gap-3">
						{dishes.map((dish) => (
							<View key={dish.id} className="rounded-2xl border border-border bg-card p-4">
									<View className="flex-row items-start justify-between">
										<Text className="flex-1 text-lg font-bold text-cardForeground">{dish.name}</Text>
										<View className="flex-row items-center gap-3">
											<Pressable onPress={() => editDish(dish)} accessibilityLabel={`Editer ${dish.name}`}>
												<MaterialIcons name="edit" size={21} color="#60A5FA" />
											</Pressable>
											<Pressable onPress={() => deleteDish(dish)} accessibilityLabel={`Supprimer ${dish.name}`}>
												<MaterialIcons name="delete-outline" size={22} color="#F87171" />
											</Pressable>
										</View>
									</View>
								<Text className="mb-3 mt-1 text-sm text-foregroundMuted">{dish.ingredients.join('  •  ')}</Text>
								<Pressable
									className="flex-row items-center justify-center rounded-xl border border-primary px-4 py-2 active:opacity-70"
									onPress={() => addDishToGroceryList(dish)}
									disabled={saving}
								>
									<MaterialIcons name="playlist-add" size={20} color="#60A5FA" />
									<Text className="ml-2 font-bold text-primary">{saving ? 'Adding...' : 'Ajouter à la liste'}</Text>
								</Pressable>
							</View>
						))}
					</View>
				)}
			</ScrollView>
		</KeyboardAvoidingView>
	)
}
