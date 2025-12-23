"use client";

import Image from "next/image";

/* =======================
   Mock Data
======================= */

const stores = [
  {
    id: 1,
    name: "اسم کامل فروشگاه",
    location: "اسم کامل استان و شهر",
    rating: 4.8,
    reviews: 2988,
    coverImage: "/images/fruits.jpg",
  },
  {
    id: 2,
    name: "اسم کامل فروشگاه",
    location: "اسم کامل استان و شهر",
    rating: 4.8,
    reviews: 2988,
    coverImage: "/images/fruits.jpg",
  },
  {
    id: 3,
    name: "اسم کامل فروشگاه",
    location: "اسم کامل استان و شهر",
    rating: 4.8,
    reviews: 2988,
    coverImage: "/images/fruits.jpg",
  },
];

/* =======================
   ATOMS
======================= */

const Avatar = () => (
  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gray-200 border-4 border-white" />
);

const StarRating = ({
  rating,
  reviews,
}: {
  rating: number;
  reviews: number;
}) => (
  <div className="flex items-center gap-1 text-xs text-gray-600">
    <span className="text-black">★</span>
    <span className="font-medium">{rating}</span>
    <span className="text-gray-400">({reviews.toLocaleString()})</span>
  </div>
);

const Text = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <p className={className}>{children}</p>;

/* =======================
   MOLECULES
======================= */

const StoreHeader = ({ image }: { image: string }) => (
  <div className="relative h-28 w-full overflow-hidden rounded-t-2xl">
    <Image
      src={image}
      alt="store cover"
      fill
      className="object-cover"
    />
    <Avatar />
  </div>
);

const StoreInfo = ({
  name,
  location,
  rating,
  reviews,
}: {
  name: string;
  location: string;
  rating: number;
  reviews: number;
}) => (
  <div className="pt-10 text-center space-y-1">
    <Text className="text-sm font-bold text-gray-900">
      {name}
    </Text>
    <Text className="text-xs text-gray-500">
      {location}
    </Text>
    <StarRating rating={rating} reviews={reviews} />
  </div>
);

/* =======================
   ORGANISM
======================= */

const StoreCard = ({
  store,
}: {
  store: (typeof stores)[0];
}) => (
  <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
    <StoreHeader image={store.coverImage} />
    <div className="px-4 pb-4">
      <StoreInfo
        name={store.name}
        location={store.location}
        rating={store.rating}
        reviews={store.reviews}
      />
    </div>
  </div>
);

/* =======================
   PAGE / DEMO
======================= */

const StoreCardList = () => {
  return (
    <div className="space-y-4 p-4 max-w-sm mx-auto">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </div>
  );
};

export default StoreCardList;
