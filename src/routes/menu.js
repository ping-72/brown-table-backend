const express = require('express');
const MenuItem = require('../models/MenuItem');

const router = express.Router();

// Sample menu data - in production, this would be in your database
const sampleMenuData = {
  "data": [
    {
      "title": "Dairy & Cheese",
      "items": [
        {
          "id": "hot-corn-cheddar-poppers",
          "name": "Hot Corn Cheddar Poppers",
          "description": "Corn and cheddar meet jalapeno heat with a Thai twist",
          "price": 280,
          "type": "veg",
          "category": "food"
        },
        {
          "id": "old-mans-cigars",
          "name": "Old Man's Cigars",
          "description": "Smooth cream cheese rolled in a crispy shell, bringing old-school comfort with every bite.",
          "price": 325,
          "type": "veg",
          "category": "food"
        },
        {
          "id": "goat-cheese-log",
          "name": "Goat Cheese Log",
          "description": "Creamy goat cheese rolled with friend garlic, parsley and roasted seeds, perfect for spreading, or savoring on its own",
          "price": 550,
          "type": "veg",
          "category": "food"
        },
        {
          "id": "brie-tempura",
          "name": "Brie Tempura",
          "description": "Creamy brie coated in a light, crispy tempura shell for an indulgent, elegant crunch",
          "price": 500,
          "type": "veg",
          "category": "food"
        }
      ]
    },
    {
      "title": "Meat & Seafood",
      "items": [
        {
          "id": "chilli-miso-glazed-chicken",
          "name": "Chilli Miso Glazed Chicken",
          "description": "Tender chicken glazed with a miso-chilli sauce- smoky, spicy, and effortlessly delicious",
          "price": 420,
          "type": "non-veg",
          "category": "food"
        },
        {
          "id": "chicken-karage",
          "name": "Chicken Karage",
          "description": "Delicate yet flavourful Japanese karaage-style chicken pieces",
          "price": 320,
          "type": "non-veg",
          "category": "food"
        },
        {
          "id": "mutton-borek",
          "name": "Mutton Börek",
          "description": "Crispy borek concealing a hearty mutton filling",
          "price": 350,
          "type": "non-veg",
          "category": "food"
        },
        {
          "id": "the-belly-affair",
          "name": "The Belly Affair",
          "description": "Juicy pork belly braised until irresistibly tender",
          "price": 550,
          "type": "non-veg",
          "category": "food"
        }
      ]
    },
    {
      "title": "Appetizers",
      "items": [
        {
          "id": "zaatar-fries-truffle-dip",
          "name": "Za'atar Fries with Truffle Dip",
          "description": "Middle Eastern Herb-infused fries complemented by a truffle dip",
          "price": 300,
          "type": "veg",
          "category": "food"
        },
        {
          "id": "oyster-mushroom-tempura",
          "name": "Oyster Mushroom Tempura",
          "description": "Light golden, and perfect for snacking",
          "price": 300,
          "type": "veg",
          "category": "food"
        },
        {
          "id": "aubergine-fingers-lemon-gel",
          "name": "Aubergine Fingers with lemon Gel",
          "description": "Smoky aubergine fingers served with our in-house lemon gel.",
          "price": 450,
          "type": "veg",
          "category": "food"
        }
      ]
    },
    {
      "title": "Salads",
      "items": [
        {
          "id": "caesar-salad",
          "name": "Caesar Salad",
          "description": "Classic Caesar salad with romaine lettuce, croutons, and Caesar dressing",
          "price": 250,
          "type": "veg",
          "category": "food"
        }
      ]
    },
    {
      "title": "Soups",
      "items": [
        {
          "id": "tomato-soup",
          "name": "Tomato Soup",
          "description": "Classic tomato soup with a creamy texture and a hint of garlic",
          "price": 250,
          "type": "veg",
          "category": "food"
        }
      ]
    },
    {
      "title": "Wines",
      "items": [
        {
          "id": "red-wine",
          "name": "Red Wine",
          "description": "Classic red wine with a creamy texture and a hint of garlic",
          "price": 250,
          "type": "veg",
          "category": "wine"
        }
      ]
    },
    {
      "title": "Beers",
      "items": [
        {
          "id": "craft-beer",
          "name": "Craft Beer",
          "description": "Premium craft beer with rich flavor and smooth finish",
          "price": 250,
          "type": "veg",
          "category": "beer"
        }
      ]
    }
  ]
};

// GET /api/menu - Get all menu items
router.get('/', async (req, res) => {
  try {
    const { category, type, section } = req.query;

    // For now, return sample data. In production, query from database
    let menuData = JSON.parse(JSON.stringify(sampleMenuData));

    // Apply filters if provided
    if (category || type || section) {
      menuData.data = menuData.data.map(sectionData => {
        const filteredItems = sectionData.items.filter(item => {
          if (category && item.category !== category) return false;
          if (type && item.type !== type) return false;
          if (section && sectionData.title !== section) return false;
          return true;
        });
        return { ...sectionData, items: filteredItems };
      }).filter(sectionData => sectionData.items.length > 0);
    }

    res.json({
      success: true,
      data: menuData
    });

  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get menu',
      error: error.message
    });
  }
});

// GET /api/menu/menu1 - Get specific menu section (Starters & Appetizers)
router.get('/menu1', async (req, res) => {
  try {
    const menu1Data = {
      data: sampleMenuData.data.filter(section => 
        ['Dairy & Cheese', 'Appetizers'].includes(section.title)
      )
    };

    res.json({
      success: true,
      data: menu1Data,
      menuType: 'menu1',
      title: 'Starters & Appetizers'
    });

  } catch (error) {
    console.error('Get menu1 error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get menu1',
      error: error.message
    });
  }
});

// GET /api/menu/menu2 - Get specific menu section (Mains & Entrees)
router.get('/menu2', async (req, res) => {
  try {
    const menu2Data = {
      data: sampleMenuData.data.filter(section => 
        ['Meat & Seafood', 'Salads', 'Soups'].includes(section.title)
      )
    };

    res.json({
      success: true,
      data: menu2Data,
      menuType: 'menu2',
      title: 'Mains & Entrees'
    });

  } catch (error) {
    console.error('Get menu2 error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get menu2',
      error: error.message
    });
  }
});

// GET /api/menu/menu3 - Get specific menu section (Beverages)
router.get('/menu3', async (req, res) => {
  try {
    const menu3Data = {
      data: sampleMenuData.data.filter(section => 
        ['Wines', 'Beers'].includes(section.title)
      )
    };

    res.json({
      success: true,
      data: menu3Data,
      menuType: 'menu3',
      title: 'Beverages'
    });

  } catch (error) {
    console.error('Get menu3 error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get menu3',
      error: error.message
    });
  }
});

// GET /api/menu/item/:itemId - Get specific menu item
router.get('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    // Find item in sample data
    let foundItem = null;
    let foundSection = null;

    for (const section of sampleMenuData.data) {
      const item = section.items.find(item => item.id === itemId);
      if (item) {
        foundItem = item;
        foundSection = section.title;
        break;
      }
    }

    if (!foundItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: {
        item: foundItem,
        section: foundSection
      }
    });

  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get menu item',
      error: error.message
    });
  }
});

module.exports = router; 