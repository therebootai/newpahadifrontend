import ProductPage from '@/components/ProductPage'
import { getProducts, getVariantBySlug } from '@/lib/services/product'

const page = async () => {
  const products = await getProducts({ limit: 1 })
  const product = products[0] || null
  const variant = product?.slug ? await getVariantBySlug(product.slug) : null

  return (
    <div>
        <div className='main-shell'>
            <ProductPage product={product} variant={variant} />
        </div>  
    </div>
  )
}

export default page
