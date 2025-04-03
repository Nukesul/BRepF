import { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Home = () => {
  const [branches, setBranches] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showBranchSelection, setShowBranchSelection] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState("pickup");
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState(null);
  const categoriesRef = useRef({});
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const storyTimerRef = useRef(null);

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
      } catch (err) {
        setError("Не удалось загрузить данные.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Функция для получения базовой цены продукта
  const getBasePrice = (product, size = null) => {
    if (size) {
      return Number(product[`price_${size}`]) || 0;
    }
    // Если есть размеры, берем минимальную цену из доступных
    if (product.price_small || product.price_medium || product.price_large) {
      return (
        Number(product.price_small) ||
        Number(product.price_medium) ||
        Number(product.price_large) ||
        0
      );
    }
    // Если размеров нет, берем price_single
    return Number(product.price_single) || 0;
  };

  // Функция для расчета цены с учетом скидок
  const getDiscountedPrice = (product, size = null) => {
    const basePrice = getBasePrice(product, size);
    const discount = discounts.find((d) => d.product_id === product.id);
    const discountPercent = discount ? Number(discount.discount_percent) || 0 : 0;
    const promoPercent = Number(promoDiscount) || 0;
    const discountedPrice = basePrice * (1 - discountPercent / 100);
    return promoPercent > 0 ? discountedPrice * (1 - promoPercent / 100) : discountedPrice;
  };

  const formatPrice = (price) => Number(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

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
    if (cart.length >= 1) {
      setShowCartModal(true);
    }
  };

  const getImageUrl = (imagePath) =>
    imagePath
      ? `https://nukesul-brepb-651f.twc1.net/product-image/${
          imagePath.includes("boody-images/") ? imagePath.split("boody-images/")[1] : imagePath
        }`
      : "https://via.placeholder.com/300";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans antialiased">
      <Header user={user} />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="pizza-loader">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="pizza-slice"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-lg text-red-600 font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Products */}
            {selectedBranch && (
              <section className="space-y-8">
                <div className="space-y-12">
                  {categories.map((category) => {
                    const categoryProducts = filteredProducts.filter((p) => p.category_id === category.id);
                    if (!categoryProducts.length) return null;
                    return (
                      <div key={category.id} ref={(el) => (categoriesRef.current[category.id] = el)}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">{category.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categoryProducts.map((product) => (
                            <div
                              key={product.id}
                              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
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
                                <h4 className="text-lg font-bold text-gray-900 tracking-tight">{product.name}</h4>
                                <p className="text-sm text-gray-500 line-clamp-2">{product.description || "Нет описания"}</p>
                                <div className="mt-3 flex items-center justify-between">
                                  <p className="text-orange-500 font-bold text-lg">
                                    {formatPrice(getDiscountedPrice(product))} Сом
                                    {discounts.some((d) => d.product_id === product.id) && product.price_single && (
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
                                    className="py-2 px-4 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition font-bold shadow-md"
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
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6"
                onClick={() => setSelectedProduct(null)}
              >
                <div
                  className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-95 animate-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative">
                    <img
                      src={getImageUrl(selectedProduct.image)}
                      alt={selectedProduct.name}
                      className="w-full h-64 object-cover rounded-t-2xl"
                    />
                    <button
                      className="absolute top-3 right-3 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition shadow-md"
                      onClick={() => setSelectedProduct(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{selectedProduct.name}</h3>
                    <p className="text-gray-500 text-base">{selectedProduct.description || "Нет описания"}</p>
                    {(selectedProduct.price_small || selectedProduct.price_medium || selectedProduct.price_large) ? (
                      <div className="space-y-3">
                        {["small", "medium", "large"].map(
                          (size) =>
                            selectedProduct[`price_${size}`] && (
                              <button
                                key={size}
                                onClick={() => addToCart(selectedProduct, size)}
                                className="w-full py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition flex justify-between items-center px-6 font-bold shadow-md"
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
                          className="py-2 px-6 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition font-bold shadow-md"
                        >
                          В корзину
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Остальной код остается без изменений */}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Home;