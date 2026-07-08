import { Request, Response } from 'express';
import Product from '../models/Product';
import Order from '../models/Order';
import Company from '../models/Company';

// 1. PUBLIC: Get materials for the shop
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const query: any = { inStock: true };
    if (category) {
      query.category = category as string;
    }
    const products = await Product.find(query)
      .populate({
        path: 'ownerId',
        populate: { path: 'owner', select: 'phone' }
      })
      .lean();
    
    // Ensure all products have the owner's whatsapp number and location
    const enrichedProducts = products.map((p: any) => {
      if (p.ownerId) {
        const company = p.ownerId;
        const userPhone = company.owner?.phone || '';
        p.whatsappNumber = p.whatsappNumber || company.receiptSettings?.whatsappNumber || company.phone || userPhone || '';
        p.city = company.city || '';
        p.country = company.country || '';
        p.ownerId = company._id; // Flatten back to ID string to prevent frontend issues
      }
      return p;
    });

    res.status(200).json(enrichedProducts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching marketplace" });
  }
};

// 1b. PUBLIC: Get single material by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product: any = await Product.findById(req.params.id)
      .populate({
        path: 'ownerId',
        populate: { path: 'owner', select: 'phone' }
      })
      .lean();
      
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    if (product.ownerId) {
      const company = product.ownerId;
      const userPhone = company.owner?.phone || '';
      product.whatsappNumber = product.whatsappNumber || company.receiptSettings?.whatsappNumber || company.phone || userPhone || '';
      product.ownerId = company._id;
    }
    
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product details" });
  }
};

// 2. OWNER: Place an order for a site
export const createOrder = async (req: any, res: Response) => {
  try {
    const { itemName, supplier, amount } = req.body;
    const newOrder = new Order({
      company: req.user.companyId,
      itemName,
      supplier,
      amount,
      orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`
    });
    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    res.status(500).json({ message: "Failed to process order" });
  }
};

// 3. OWNER: Get active site deliveries (Fixes the 404)
export const getOrders = async (req: any, res: Response) => {
  try {
    const orders = await Order.find({ company: req.user.companyId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};

// 4. OWNER: Get spending analytics for widget (Fixes the 404)
export const getMarketplaceStats = async (req: any, res: Response) => {
  try {
    const orders = await Order.find({ company: req.user.companyId });
    const totalSpent = orders.reduce((acc, curr) => acc + curr.amount, 0);
    
    res.status(200).json({
      totalSpent,
      budgetUtilization: totalSpent > 0 ? Math.min(Math.round((totalSpent / 50000) * 100), 100) : 0,
      availableCredit: Math.max(50000 - totalSpent, 0)
    });
  } catch (error) {
    res.status(500).json({ message: "Error calculating stats" });
  }
};

// 5. PROTECTED: Add new material to global database
export const addProduct = async (req: any, res: Response) => {
  try {
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const productData = {
      ...req.body,
      supplier: company.name,
      whatsappNumber: company.receiptSettings?.whatsappNumber || company.phone || '',
      ownerId: company._id,
      image: req.file ? req.file.path : undefined
    };
    const product = new Product(productData);
    await product.save();
    res.status(201).json({ message: "Product added to BuildHub Catalog", product });
  } catch (error) {
    res.status(500).json({ message: "Error adding product" });
  }
};

// 6. PROTECTED: Get supplier's own products
export const getMyProducts = async (req: any, res: Response) => {
  try {
    const products = await Product.find({ ownerId: req.user.companyId })
                                  .sort({ createdAt: -1 })
                                  .populate({
                                    path: 'ownerId',
                                    populate: { path: 'owner', select: 'phone' }
                                  })
                                  .lean();
                                  
    const enrichedProducts = products.map((p: any) => {
      if (p.ownerId) {
        const company = p.ownerId;
        const userPhone = company.owner?.phone || '';
        p.whatsappNumber = p.whatsappNumber || company.receiptSettings?.whatsappNumber || company.phone || userPhone || '';
        p.ownerId = company._id;
      }
      return p;
    });
    
    res.status(200).json(enrichedProducts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching your products" });
  }
};

// 7. PROTECTED: Update a product
export const updateProduct = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, ownerId: req.user.companyId });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ message: "Product updated", product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: "Error updating product" });
  }
};

// 8. PROTECTED: Delete a product
export const deleteProduct = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({ _id: id, ownerId: req.user.companyId });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product" });
  }
};