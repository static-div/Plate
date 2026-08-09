import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { FoodForm } from '../components/food/FoodForm'
import { useCurrentUserId } from '../hooks/useCurrentUserId'
import type { FoodRow } from '../services/db/types'
import { createFood, getFood, updateFood, type CreateFoodInput } from '../services/food'

export function FoodEditPage() {
  const { id } = useParams()
  const userId = useCurrentUserId()
  const navigate = useNavigate()
  const [existing, setExisting] = useState<FoodRow | null>(null)
  const [loading, setLoading] = useState(Boolean(id))

  useEffect(() => {
    if (!id) return
    getFood(userId, id).then((food) => {
      setExisting(food)
      setLoading(false)
    })
  }, [id, userId])

  async function handleSubmit(values: CreateFoodInput) {
    if (id) {
      await updateFood(userId, id, values)
    } else {
      await createFood(userId, values)
    }
    navigate('/food')
  }

  if (loading) {
    return (
      <div className="page">
        <p className="text-muted">Loading…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="heading">{id ? 'Edit food' : 'Add food'}</h1>
      <FoodForm
        initial={existing ?? undefined}
        onSubmit={handleSubmit}
        submitLabel={id ? 'Save changes' : 'Add food'}
      />
    </div>
  )
}
