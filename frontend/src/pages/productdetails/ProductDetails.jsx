import { useParams } from "react-router-dom";
import Product from "./component/product/Product"

const ProductDetails = () => {
    const { id } = useParams();
    return (
        <>
            <Product productId={id} />
        </>
    )
}

export default ProductDetails