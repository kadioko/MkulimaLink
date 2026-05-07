const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: 500
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  collections: [{
    name: {
      type: String,
      required: true
    },
    items: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for user lookups
wishlistSchema.index({ user: 1 });

// Method to add item to wishlist
wishlistSchema.methods.addItem = async function(productId, notes = '', priority = 'medium') {
  const exists = this.items.some(item => item.product.toString() === productId.toString());
  if (exists) {
    throw new Error('Item already in wishlist');
  }
  
  this.items.push({
    product: productId,
    notes,
    priority,
    addedAt: new Date()
  });
  
  return await this.save();
};

// Method to remove item
wishlistSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(item => 
    item.product.toString() !== productId.toString()
  );
  
  // Remove from all collections too
  this.collections.forEach(collection => {
    collection.items = collection.items.filter(id => 
      id.toString() !== productId.toString()
    );
  });
  
  return await this.save();
};

// Method to check if product is in wishlist
wishlistSchema.methods.hasItem = function(productId) {
  return this.items.some(item => item.product.toString() === productId.toString());
};

// Get or create wishlist
wishlistSchema.statics.getOrCreate = async function(userId) {
  let wishlist = await this.findOne({ user: userId });
  if (!wishlist) {
    wishlist = new this({ user: userId, items: [], collections: [] });
    await wishlist.save();
  }
  return wishlist;
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
