import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { supabase } from '@/utils/supabase'
import showToast from '@/utils/showToast'

type Dish = {
	id: string
	user_id: string
	name: string
	ingredients: Ingredient[]
	is_public: boolean
}

type Ingredient = {
	id?: string
	name: string
	quantity: number
}

type GroceryItem = {
	id: number
	name: string
	quantity: number | null
}

type ItemOperation = () => Promise<{ error: { message: string } | null }>

export default function Menus() {
	const [dishes, setDishes] = useState<Dish[]>([])
	const [dishName, setDishName] = useState('')
	const [ingredientName, setIngredientName] = useState('')
	const [ingredientQuantity, setIngredientQuantity] = useState('1')
	const [ingredients, setIngredients] = useState<Ingredient[]>([])
	const [editingDishId, setEditingDishId] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [isPublic, setIsPublic] = useState(false)
	const [loadingDishes, setLoadingDishes] = useState(true)
	const [currentUserId, setCurrentUserId] = useState<string | null>(null)

	useEffect(() => {
		const loadDishes = async () => {
			setLoadingDishes(true)
			const { data: { user } } = await supabase.auth.getUser()
			if (!user) {
				setLoadingDishes(false)
				return
			}
			setCurrentUserId(user.id)

			const { data, error } = await supabase
				.from('recipes')
				.select('id, user_id, name, is_public, recipe_ingredients(id, name, quantity)')
				.or(`user_id.eq.${user.id},is_public.eq.true`)
				.order('created_at', { ascending: false })

			if (error) {
				showToast('error', 'Error', error.message)
				setLoadingDishes(false)
				return
			}

			setDishes((data ?? []).map((recipe: any) => ({
				id: recipe.id,
				user_id: recipe.user_id,
				name: recipe.name,
				is_public: recipe.is_public,
				ingredients: (recipe.recipe_ingredients ?? [])
					.map((ingredient: any) => ({ id: ingredient.id, name: ingredient.name, quantity: ingredient.quantity || 1 })),
			})))
			setLoadingDishes(false)
		}

		loadDishes()
	}, [])

	const addIngredient = () => {
		const nextIngredient = ingredientName.trim()
		const nextQuantity = Number.parseInt(ingredientQuantity, 10)
		if (!nextIngredient || !Number.isInteger(nextQuantity) || nextQuantity < 1) {
			Alert.alert('Invalid ingredient', 'Enter an ingredient and a quantity of at least 1.')
			return
		}

		setIngredients((currentIngredients) => [...currentIngredients, { name: nextIngredient, quantity: nextQuantity }])
		setIngredientName('')
		setIngredientQuantity('1')
	}

	const createDish = async () => {
		const name = dishName.trim()
		if (!name || ingredients.length === 0) {
			Alert.alert('Complete your dish', 'Add a dish name and at least one ingredient.')
			return
		}

		setSaving(true)
		try {
			const { data: { user } } = await supabase.auth.getUser()
			if (!user) {
				showToast('error', 'Error', 'You must be signed in to save a recipe.')
				return
			}

			let recipeId = editingDishId
			let savedIngredients = [...ingredients]
			if (editingDishId) {
				const { data: updatedRecipe, error } = await supabase
					.from('recipes')
					.update({ name, is_public: isPublic })
					.eq('id', editingDishId)
					.eq('user_id', user.id)
					.select('id, is_public')
					.single()
				if (error) {
					throw new Error(`Unable to update the recipe visibility. Check the recipes UPDATE policy: ${error.message}`)
				}
				if (updatedRecipe.is_public !== isPublic) {
					throw new Error('The recipe visibility was not saved by Supabase.')
				}

				const originalDish = dishes.find((dish) => dish.id === editingDishId)
				const retainedIngredientIds = new Set(ingredients.map((ingredient) => ingredient.id).filter(Boolean))
				const removedIngredientIds = (originalDish?.ingredients ?? [])
					.map((ingredient) => ingredient.id)
					.filter((id): id is string => Boolean(id) && !retainedIngredientIds.has(id))

				if (removedIngredientIds.length > 0) {
					const { error: deleteIngredientsError } = await supabase
						.from('recipe_ingredients')
						.delete()
						.in('id', removedIngredientIds)
					if (deleteIngredientsError) throw deleteIngredientsError
				}

				for (const ingredient of ingredients.filter((currentIngredient) => currentIngredient.id)) {
					const { error: updateIngredientError } = await supabase
						.from('recipe_ingredients')
						.update({ name: ingredient.name, quantity: ingredient.quantity })
						.eq('id', ingredient.id)
						.eq('recipe_id', editingDishId)
					if (updateIngredientError) throw updateIngredientError
				}

				const newIngredients = ingredients.filter((ingredient) => !ingredient.id)
				if (newIngredients.length > 0) {
					const { error: insertIngredientsError } = await supabase.from('recipe_ingredients').insert(
						newIngredients.map((ingredient) => ({ recipe_id: editingDishId, name: ingredient.name, quantity: ingredient.quantity })),
					)
					if (insertIngredientsError) {
						throw new Error(`Unable to add the new ingredient. Check the recipe_ingredients INSERT policy: ${insertIngredientsError.message}`)
					}
				}
			} else {
				const { data: recipe, error } = await supabase.from('recipes').insert({ user_id: user.id, name, is_public: isPublic }).select('id').single()
				if (error) throw error
				recipeId = recipe.id
			}

			if (!editingDishId) {
				const { error: ingredientsError } = await supabase.from('recipe_ingredients').insert(
					ingredients.map((ingredient) => ({ recipe_id: recipeId, name: ingredient.name, quantity: ingredient.quantity })),
				)
				if (ingredientsError) {
					throw new Error(`Unable to add recipe ingredients. Check the recipe_ingredients INSERT policy: ${ingredientsError.message}`)
				}
			}

			const { data: savedIngredientRows, error: savedIngredientsError } = await supabase
				.from('recipe_ingredients')
				.select('id, name, quantity')
				.eq('recipe_id', recipeId)
			if (savedIngredientsError) {
				throw new Error(`Recipe ingredients were saved, but could not be read back: ${savedIngredientsError.message}`)
			}
			savedIngredients = (savedIngredientRows ?? []).map((ingredient: any) => ({
					id: ingredient.id,
					name: ingredient.name,
					quantity: ingredient.quantity,
			}))

			const savedDish: Dish = { id: recipeId!, user_id: user.id, name, ingredients: savedIngredients, is_public: isPublic }
			setDishes((current) => editingDishId
				? current.map((dish) => dish.id === editingDishId ? savedDish : dish)
				: [savedDish, ...current])
		setDishName('')
		setIngredients([])
		setIngredientQuantity('1')
		setEditingDishId(null)
		setIsPublic(false)
		showToast('success', editingDishId ? 'Dish updated' : 'Dish saved', `${name} is ready in your dishes.`)
		} catch (error) {
            console.error('Error saving recipe:', error instanceof Error ? error.message : error)
			showToast('error', 'Error', error instanceof Error ? error.message : 'Unable to save the recipe.')
		} finally {
			setSaving(false)
		}
	}

	const editDish = (dish: Dish) => {
		setEditingDishId(dish.id)
		setDishName(dish.name)
		setIngredients([...dish.ingredients])
		setIsPublic(dish.is_public)
	}

	const cancelEditing = () => {
		setEditingDishId(null)
		setDishName('')
		setIngredients([])
		setIngredientQuantity('1')
		setIsPublic(false)
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
						const { error } = await supabase.from('recipes').delete().eq('id', dish.id).eq('user_id', dish.user_id)
						if (error) {
							showToast('error', 'Error', error.message)
							return
						}
						setDishes((current) => current.filter((currentDish) => currentDish.id !== dish.id))
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

			const { data: currentItems, error: fetchError } = await supabase
				.from('items')
				.select('id, name, quantity')
				.eq('user_id', user.id)

			if (fetchError) {
				showToast('error', 'Error', fetchError.message)
				return
			}

			const quantities = new Map<string, { name: string; quantity: number }>()
			for (const ingredient of dish.ingredients) {
				const trimmedName = ingredient.name.trim()
				const normalizedName = trimmedName.toLocaleLowerCase()
				if (!normalizedName) continue

				const current = quantities.get(normalizedName)
				quantities.set(normalizedName, {
					name: current?.name ?? trimmedName,
					quantity: (current?.quantity ?? 0) + ingredient.quantity,
				})
			}

			const items = (currentItems ?? []) as GroceryItem[]
			const operations: ItemOperation[] = []
			const inserts: { name: string; quantity: number; purchased: boolean; user_id: string }[] = []

			for (const [normalizedName, ingredient] of quantities) {
				const existingItem = items.find((item) => item.name.trim().toLocaleLowerCase() === normalizedName)
				if (existingItem) {
					operations.push(async () => {
						const { error } = await supabase
							.from('items')
							.update({ quantity: (existingItem.quantity ?? 0) + ingredient.quantity })
							.eq('id', existingItem.id)
						return { error: error ? { message: error.message } : null }
					})
				} else {
					inserts.push({
						name: ingredient.name,
						quantity: ingredient.quantity,
						purchased: false,
						user_id: user.id,
					})
				}
			}

			if (inserts.length > 0) {
				operations.push(async () => {
					const { error } = await supabase.from('items').insert(inserts)
					return { error: error ? { message: error.message } : null }
				})
			}

			const results = await Promise.all(operations.map((operation) => operation()))
			const failedResult = results.find((result) => result.error)

			if (failedResult?.error) {
				showToast('error', 'Error', failedResult.error.message)
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
					<Pressable
						className="mb-4 flex-row items-center justify-between rounded-xl bg-backgroundSecondary px-4 py-3"
						onPress={() => setIsPublic((current) => !current)}
						accessibilityRole="switch"
						accessibilityState={{ checked: isPublic }}
					>
						<View className="flex-1">
							<Text className="font-semibold text-foreground">Partager avec la communauté</Text>
							<Text className="mt-1 text-xs text-foregroundMuted">
								{isPublic ? 'Votre plat sera visible par les autres utilisateurs.' : 'Votre plat restera privé.'}
							</Text>
						</View>
						<View className={`h-7 w-12 justify-center rounded-full px-1 ${isPublic ? 'bg-primary' : 'bg-border'}`}>
							<View className={`h-5 w-5 rounded-full bg-white ${isPublic ? 'self-end' : 'self-start'}`} />
						</View>
					</Pressable>
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
						<TextInput
							className="w-16 rounded-xl border border-border bg-input px-3 py-3 text-center text-foreground"
							placeholder="Qté"
							placeholderTextColor="#94A3B8"
							value={ingredientQuantity}
							onChangeText={setIngredientQuantity}
							keyboardType="number-pad"
							maxLength={3}
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
											<View key={`${ingredient.name}-${index}`} className="flex-row items-center justify-between rounded-lg bg-backgroundSecondary px-3 py-2">
												<Text className="flex-1 text-foreground">{ingredient.name} x{ingredient.quantity}</Text>
									<Pressable
										onPress={() => setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))}
													accessibilityLabel={`Enlever ${ingredient.name}`}
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
				{loadingDishes ? (
					<Text className="py-8 text-center text-foregroundMuted">Chargement des plats...</Text>
				) : dishes.length === 0 ? (
					<View className="rounded-2xl border border-dashed border-border px-5 py-8">
						<Text className="text-center text-foregroundMuted">Vos plats apparaîtront ici.</Text>
					</View>
				) : (
					<View className="gap-3">
						{dishes.map((dish) => (
							<View key={dish.id} className="rounded-2xl border border-border bg-card p-4">
									<View className="flex-row items-start justify-between">
										<Text className="flex-1 text-lg font-bold text-cardForeground">{dish.name}</Text>
										{dish.user_id === currentUserId ? (
											<View className="flex-row items-center gap-3">
												<Pressable onPress={() => editDish(dish)} accessibilityLabel={`Editer ${dish.name}`}>
													<MaterialIcons name="edit" size={21} color="#60A5FA" />
												</Pressable>
												<Pressable onPress={() => deleteDish(dish)} accessibilityLabel={`Supprimer ${dish.name}`}>
													<MaterialIcons name="delete-outline" size={22} color="#F87171" />
												</Pressable>
											</View>
										) : null}
									</View>
								<Text className="mb-3 mt-1 text-sm text-foregroundMuted">
									{dish.ingredients.map((ingredient) => `${ingredient.name} x${ingredient.quantity}`).join('  •  ')}
								</Text>
								{dish.is_public ? <Text className="mb-3 text-xs font-semibold text-success">Plat public</Text> : null}
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
