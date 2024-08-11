import { useState } from 'react';
import Modal from './Modal';

function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Nature', 'People', 'Architecture'];

  const handleUpload = (e) => {
    e.preventDefault();
    const file = e.target.image.files[0];
    const caption = e.target.caption.value;
    const category = e.target.category.value;
    const timestamp = new Date().toLocaleString();

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages([...images, { src: reader.result, caption, category, timestamp }]);
      };
      reader.readAsDataURL(file);
    }

    e.target.reset();
  };

  const openModal = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const filterImages = () => {
    let filteredImages = images;

    if (selectedCategory !== 'All') {
      filteredImages = filteredImages.filter(image => image.category === selectedCategory);
    }

    if (searchTerm) {
      filteredImages = filteredImages.filter(image => 
        image.caption.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredImages;
  };

  const countImagesInCategory = (category) => {
    return images.filter(image => image.category === category).length;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="p-6 bg-gray-200 rounded-3xl shadow-neumorphism mb-10">
        <form onSubmit={handleUpload}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
              Upload Image
            </label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="caption">
              Caption
            </label>
            <input
              type="text"
              id="caption"
              name="caption"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
              placeholder="Enter caption"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none shadow-neumorphism"
          >
            Upload
          </button>
        </form>
      </div>

      {/* Search Bar */}
      <div className="mb-4 w-full max-w-md">
        <input
          type="text"
          placeholder="Search by caption..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-10">
        <select
          className="shadow appearance-none border rounded py-2 px-4 text-gray-700 leading-tight focus:outline-none bg-white"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="All">All ({images.length})</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category} ({countImagesInCategory(category)})
            </option>
          ))}
        </select>
      </div>

      {/* Display message if no images are available */}
      {filterImages().length === 0 ? (
        <div className="text-gray-700 text-sm font-bold">
          No images match your search or category.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filterImages().map((image, index) => (
            <div
              key={index}
              className="p-4 bg-gray-200 rounded-3xl shadow-neumorphism cursor-pointer"
              onClick={() => openModal(image)}
            >
              <img src={image.src} alt={image.caption} className="w-full h-48 object-cover rounded-lg mb-4" />
              <p className="text-gray-700 text-sm font-bold">{image.caption}</p>
              <p className="text-gray-500 text-xs">{image.timestamp}</p>
              <p className="text-gray-500 text-xs italic">{image.category}</p>
            </div>
          ))}
        </div>
      )}

      {/* Full-size image modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} image={selectedImage} />
    </div>
  );
}

export default App;