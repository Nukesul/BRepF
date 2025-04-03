import { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Home = () => {
  const [branches, setBranches] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [stories, setStories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const categoriesRef = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoints = ["branches", "products", "discounts", "stories", "categories"];
        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            fetch(`https://nukesul-brepb-651f.twc1.net/${endpoint}`).then((res) => {
              if (!res.ok) throw new Error(`Ошибка загрузки ${endpoint}`);
              return res.json();
            })
          )
        );
        setBranches(responses[0]);
        setAllProducts(responses[1]);
        setDiscounts(responses[2]);
        setStories(responses[3]);
        setCategories(responses[4]);
        setSelectedBranch(5); // Устанавливаем филиал "Араванский" для теста
      } catch (err) {
        setError("Не удалось загрузить данные: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBranch && allProducts.length) {
      const branchProducts = allProducts.filter((product) => product.branch_id === selectedBranch);
      setFilteredProducts(branchProducts);
      console.log("Filtered Products:", branchProducts); // Дебаггинг
    }
  }, [selectedBranch, allProducts]);

  // Получение базовой цены
  const getBasePrice = (product, size = null) => {
    if (size) {
      const price = parseFloat(product[`price_${size}`]) || 0;
      console.log(`Base Price for ${product.name} (${size}): ${price}`); // Дебаггинг
      return price;
    }
    const prices = [
      parseFloat(product.price_small) || Infinity,
      parseFloat(product.price_medium) || Infinity,
      parseFloat(product.price_large) || Infinity,
      parseFloat(product.price_single) || Infinity,
    ].filter((p) => p !== Infinity);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    console.log(`Base Price for ${product.name} (default): ${minPrice}`); // Дебаггинг
    return minPrice;
  };

  // Расчет цены со скидкой
  const getDiscountedPrice = (product, size = null) => {
    const basePrice = getBasePrice(product, size);
    const discount = discounts.find((d) => d.product_id === product.id);
    const discountPercent = discount ? parseFloat(discount.discount_percent) || 0 : 0;
    const discountedPrice = basePrice * (1 - discountPercent / 100);
    console.log(`Discounted Price for ${product.name} (${size || "default"}): ${discountedPrice}`); // Дебаггинг
    return discountedPrice;
  };

  const formatPrice = (price) => {
    const formatted = parseFloat(price || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    console.log("Formatted Price:", formatted); // Дебаггинг
    return formatted;
  };

  const addToCart = (product, size = null) => {
    const price = getBasePrice(product, size);
    const finalPrice = getDiscountedPrice(product, size);
    const existingItemIndex = cart.findIndex((item) => item.id === product.id && item.size === size);
    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...product, size, quantity: 1, finalPrice }]);
    }
    setSelectedProduct(null);
  };

  const getImageUrl = (imagePath) =>
    imagePath
      ? `https://nukesul-brepb-651f.twc1.net/product-image/${
          imagePath.includes("boody-images/") ? imagePath.split("boody-images/")[1] : imagePath
        }`
      : "https://via.placeholder.com/300";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans antialiased">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">Загрузка...</div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md text-red-600">{error}</div>
        ) : (
          <>
            {/* Products */}
            {selectedBranch && (
              <section className="space-y-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  {branches.find((b) => b.id === selectedBranch)?.name || "Филиал"}
                </h2>
                <div className="space-y-12">
                  {categories.map((category) => {
                    const categoryProducts = filteredProducts.filter((p) => p.category_id === category.id);
                    if (!categoryProducts.length) return null;
                    return (
                      <div key={category.id} ref={(el) => (categoriesRef.current[category.id] = el)}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">{category.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categoryProducts.map((product) => (
                            <div
                              key={product.id}
                              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                              onClick={() => setSelectedProduct(product)}
                            >
                              <div className="relative overflow-hidden rounded-t-xl">
                                <img
                                  src={getImageUrl(product.image)}
                                  alt={product.name}
                                  className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                {discounts.some((d) => d.product_id === product.id) && (
                                  <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    Скидка
                                  </span>
                                )}
                              </div>
                              <div className="p-4">
                                <h4 className="text-lg font-bold text-gray-900">{product.name}</h4>
                                <p className="text-sm text-gray-500 line-clamp-2">{product.description || "Нет описания"}</p>
                                <div className="mt-3 flex items-center justify-between">
                                  <p className="text-orange-500 font-bold text-lg">
                                    {formatPrice(getDiscountedPrice(product))} Сом
                                    {discounts.some((d) => d.product_id === product.id) && (
                                      <span className="line-through text-gray-400 text-sm ml-2">
                                        {formatPrice(getBasePrice(product))}
                                      </span>
                                    )}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToCart(product);
                                    }}
                                    className="py-2 px-4 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition font-bold"
                                  >
                                    В корзину
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Product Modal */}
            {selectedProduct && (
              <div
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedProduct(null)}
              >
                <div
                  className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative">
                    <img
                      src={getImageUrl(selectedProduct.image)}
                      alt={selectedProduct.name}
                      className="w-full h-64 object-cover rounded-t-2xl"
                    />
                    <button
                      className="absolute top-3 right-3 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition"
                      onClick={() => setSelectedProduct(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="text-2xl font-extrabold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-gray-500 text-base">{selectedProduct.description || "Нет описания"}</p>
                    {(selectedProduct.price_small || selectedProduct.price_medium || selectedProduct.price_large) ? (
                      <div className="space-y-3">
                        {["small", "medium", "large"].map(
                          (size) =>
                            selectedProduct[`price_${size}`] && (
                              <button
                                key={size}
                                onClick={() => addToCart(selectedProduct, size)}
                                className="w-full py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition flex justify-between items-center px-6 font-bold"
                              >
                                <span>
                                  {size === "small" ? "Маленькая" : size === "medium" ? "Средняя" : "Большая"}
                                </span>
                                <span>
                                  {formatPrice(getDiscountedPrice(selectedProduct, size))} Сом
                                  {discounts.some((d) => d.product_id === selectedProduct.id) && (
                                    <span className="line-through text-gray-300 text-sm ml-2">
                                      {formatPrice(getBasePrice(selectedProduct, size))}
                                    </span>
                                  )}
                                </span>
                              </button>
                            )
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-orange-500 font-bold text-lg">
                          {formatPrice(getDiscountedPrice(selectedProduct))} Сом
                          {discounts.some((d) => d.product_id === selectedProduct.id) && selectedProduct.price_single && (
                            <span className="line-through text-gray-400 text-sm ml-2">
                              {formatPrice(getBasePrice(selectedProduct))}
                            </span>
                          )}
                        </p>
                        <button
                          onClick={() => addToCart(selectedProduct)}
                          className="py-2 px-6 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition font-bold"
                        >
                          В корзину
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Home;