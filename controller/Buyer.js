const bcrypt             = require('bcrypt');
const jwt                = require('jsonwebtoken');
const mongoose           = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Buyer              = require('../schema/buyerSchema')
const Supplier           = require('../schema/supplierSchema')
const Order              = require('../schema/orderSchema')
const BuyerEdit          = require('../schema/buyerEditSchema')
const{ Medicine}           = require('../schema/medicineSchema')
const MedicineInventory  = require('../schema/medicineInventorySchema')
const Support            = require('../schema/supportSchema')
const List               = require('../schema/addToListSchema');
const Enquiry            = require('../schema/enquiryListSchema')
const Notification       = require('../schema/notificationSchema')


module.exports = {

    Regsiter : async(reqObj, callback) => {
        try {
            const emailExists = await Buyer.findOne({buyer_email : reqObj.buyer_email})
            if(emailExists) {
              return callback({code : 409, message: "Email already exists"})
            }
            const buyerId     = 'BYR-' + Math.random().toString(16).slice(2);
            let jwtSecretKey  = process.env.APP_SECRET; 
            let data          = {  time : Date(),  buyerId : buyerId } 
            const token       = jwt.sign(data, jwtSecretKey); 
  
            const newBuyer = new Buyer({
                buyer_id                     : buyerId,
                buyer_type                   : reqObj.buyer_type,
                buyer_name                   : reqObj.buyer_name,
                buyer_address                : reqObj.buyer_address,
                buyer_email                  : reqObj.buyer_email,
                buyer_mobile                 : reqObj.buyer_mobile,
                buyer_country_code           : reqObj.buyer_country_code,
                contact_person_name          : reqObj.contact_person_name,
                designation                  : reqObj.designation ,
                contact_person_email         : reqObj.contact_person_email,
                contact_person_mobile        : reqObj.contact_person_mobile,
                contact_person_country_code  : reqObj.contact_person_country_code,
                country_of_origin            : reqObj.country_of_origin,
                country_of_operation         : reqObj.country_of_operation ,
                approx_yearly_purchase_value : reqObj.approx_yearly_purchase_value ,
                interested_in                : reqObj.interested_in,
                license_no                   : reqObj.license_no,
                license_expiry_date          : reqObj.license_expiry_date,
                tax_no                       : reqObj.tax_no,
                registration_no              : reqobj.registration_no,
                description                  : reqObj.description,
                buyer_image                  : reqObj.buyer_image,
                tax_image                    : reqObj.tax_image,
                license_image                : reqObj.license_image,
                certificate_image            : reqObj.certificate_image,
                token                        : token,
                account_status               : 0,
                profile_status               : 0
              });

              newBuyer.save().then(() => {
                callback({code: 200, message: "Buyer registration request submitted successfully"})
              }).catch((err) => {
                console.log('err',err);
                callback({code: 400 , message: "Error in submiiting buyer eegistration request"})
              })
          } catch (error) {
            console.log('error',error);
            callback({code: 500 , message: "Internal Server Error", error: error})
          } 
    },

    Login : async(reqObj, callback) => {
     
        const password = reqObj.password
        const email    = reqObj.email
  
        try {
          const buyer = await Buyer.findOne({ buyer_email: email });
 
          if (!buyer) {
              console.log('Not found');
              return callback({code: 404, message: "Buyer Not Found"});
          }
  
          const isMatch = await bcrypt.compare(password, buyer.password);
  
          if (isMatch) {
              const buyerData = {
                 buyer_id                    : buyer.buyer_id,
                 buyer_name                  : buyer.buyer_name,
                 buyer_address               : buyer.buyer_address,
                 description                 : buyer.description,
                 buyer_email                 : buyer.buyer_email,
                 buyer_country_code          : buyer.buyer_country_code,
                 buyer_mobile                : buyer.buyer_mobile,
                 contact_person_country_code : buyer.contact_person_country_code,
                 contact_person_email        : buyer.contact_person_email,
                 contact_person_mobile       : buyer.contact_person_mobile,
                 contact_person_name         : buyer.contact_person_name,
                 country_of_operation        : buyer.country_of_operation,
                 designation                 : buyer.designation,
                 buyer_image                 : buyer.buyer_image,
                 license_image               : buyer.license_image,
                 license_no                  : buyer.license_no,
                 tax_image                   : buyer.tax_image,
                 tax_no                      : buyer.tax_no,
                 description                 : buyer.description,
                 country_of_origin           : buyer.country_of_origin,
                 token                       : buyer.token
              }
              const listCount = await List.countDocuments({buyer_id: buyer.buyer_id})
              buyerData.list_count = listCount
              callback({code : 200, message: "Buyer Login Successfull", result: buyerData});
          } else {
              callback({code: 401, message: "Incorrect Password"});
          }
        }catch (error) {
          console.error('Error validating user:', error);
          callback({code: 500, message: "Internal Server Error"});
       }
    },

    EditProfile : async(reqObj, callback) => { 
        try {
          const {
            buyer_id, buyer_name, description, buyer_address,buyer_email, buyer_mobile, 
            buyer_country_code, contact_person_name, contact_person_mobile, contact_person_country_code,
            contact_person_email, designation, country_of_origin, country_of_operation, license_no, tax_no,
            buyer_image, tax_image, license_image
          } = reqObj

          const updateObj = {
            buyer_id,
            buyer_name,
            description,
            buyer_address,
            buyer_email,
            buyer_mobile,
            buyer_country_code,
            contact_person_name,
            contact_person_mobile,
            contact_person_country_code,
            contact_person_email,
            designation,
            country_of_origin,
            country_of_operation,
            license_no,
            tax_no,
            buyer_image,
            tax_image,
            license_image,
            edit_status : 0
          };

          const buyer = await Buyer.findOne({ buyer_id: buyer_id });
  
          if (!buyer) {
              return callback({ code: 404, message: 'Buyer Not Found' });
          }

          if(buyer.profile_status === 0) {
            return callback({code: 202, message: 'Edit request already exists for the buyer'})
          }

          Object.keys(updateObj).forEach(key => updateObj[key] === undefined && delete updateObj[key]);

          const buyerEdit = new BuyerEdit(updateObj)

          buyerEdit.save().then((data) => {
            Buyer.findOneAndUpdate({buyer_id : buyer_id},
              {
                $set : {profile_status : 0}
              }).then((result) => {
                callback({ code: 200, message: 'Profile edit request send successfully', result: data});
              })
              .catch((err) => {
                callback({ code: 400, message: 'Error while senidng profile update request', result: err});
              })
            
          })

            // Buyer.findOneAndUpdate({buyer_id: buyer_id},
            //   {
            //     $set: updateObj
            //   },{new: true}
            //   ).then((updateProfile) => {
            //     callback({ code: 200, message: 'Buyer Profile updated successfully', result: updateProfile});
            //   })
            //   .catch((err) => {
            //     callback({ code: 400, message: 'Error in updating the buyer profile', error: updateProfile});
            //   })
        } catch (error) {
          callback({ code: 500, message: 'Internal Server Error', error: error});
        }
    },

    buyerProfileDetails : async(reqObj, callback) => {
      try {
        Buyer.findOne({buyer_id: reqObj.buyer_id}).select('buyer_id buyer_name email mobile country_code company_name') 
        .then((data) => {
          callback({code: 200, message : 'Buyer details fetched successfully', result:data})
      }).catch((error) => {
          console.error('Error:', error);
          callback({code: 400, message : 'Error in fetching buyer details'})
      });
      }catch (error) {
        callback({code: 500, message : 'Internal server error'})
      }
    },

    supplierList: async (reqObj, callback) => {
      try {
        const { searchKey = '', filterCountry = '', pageNo = 1, pageSize = 1 } = reqObj;
        const offset = (pageNo - 1) * pageSize;
    
        let query = { account_status: 1 };
        
        if (searchKey) {
          query.supplier_name = { $regex: new RegExp(searchKey, 'i') };
        }
        
        if (filterCountry) {
          query.country_of_origin = filterCountry;
        }
    
        // Count total items matching the query
        const totalItems = await Supplier.countDocuments(query);
    
        // Fetch the suppliers with pagination
        const suppliers = await Supplier.find(query)
          .select('supplier_id supplier_name supplier_image supplier_country_code supplier_mobile supplier_address description license_no country_of_origin contact_person_name contact_person_mobile_no contact_person_country_code contact_person_email designation tags payment_terms estimated_delivery_time, license_expiry_date tax_no')
          .skip(offset)
          .limit(pageSize);
          const totalPages = Math.ceil(totalItems / pageSize)
          const returnObj = {
            suppliers,
            totalPages,
            totalItems
          }
        callback({ code: 200, message: 'Supplier list fetched successfully', result: returnObj });
      } catch (error) {
        console.error('Error:', error);
        callback({ code: 400, message: 'Error in fetching supplier list' });
      }
    },

    mySupplierList: async (reqObj, callback) => {
      try {
        const { supplier_id, buyer_id, status, pageNo, pageSize } = reqObj
        const page_no   = pageNo || 1
        const page_size = pageSize || 2
        const offset    = (page_no - 1) * page_size
    
        let query = { account_status: 1 };

        if (!buyer_id) {
          callback({ code: 400, message: 'buyer_id is required' });
          return;
        }
    
        // Step 1: Fetch all orders for the given buyer_id
        const orders = await Order.find({ buyer_id }).toArray();
    
        // Step 2: Extract unique supplier_ids from the orders
        const supplierIds = [...new Set(orders.map(order => order.supplier_id))];
    
        if (supplierIds.length === 0) {
          callback({ code: 200, data: [], message: 'No suppliers found' });
          return;
        }
    
        // Step 3: Fetch supplier details for these supplier_ids
        const suppliers = await Supplier.find({
          supplier_id: { $in: supplierIds },
          account_status: 1 // Assuming you want to filter by account_status as well
        })
        .skip(offset)
        .limit(page_size)
        // .toArray();
    
        callback({ code: 200, message: 'supplier list', data: suppliers });
        
       
      } catch (error) {
        console.error('Error:', error);
        callback({ code: 400, message: 'Error in fetching supplier list' });
      }
    },

    supplierDetails : async(reqObj, callback) => {
      try {

        Supplier.findOne({supplier_id: reqObj.supplier_id})
        // .select(fields.join(' ')) 
        .select()
        .then((data) => {
          callback({code: 200, message : 'Supplier details fetched successfully', result:data})
      }).catch((error) => {
          console.error('Error:', error);
          callback({code: 400, message : 'Error in fetching supplier details'})
      });
      }catch (error) {
        console.log('Internal Server Error', error)
        callback({code: 500, message : 'Internal server error'})
      }
    },

    supplierProductList : async(reqObj, callback) => {
      try {
        const { supplier_id, pageNo, pageSize } = reqObj
  
        const page_no   = pageNo || 1
        const page_size = pageSize || 2
        const offset    = (page_no - 1) * page_size

          Medicine.aggregate([
            {
              $match : {
                supplier_id : supplier_id,
              }
            },
            {
              $lookup: {
                from         : "medicineinventories",
                localField   : "medicine_id",
                foreignField : "medicine_id",
                as           : "productInventory",
              },
            },
            {
              $project: {
                medicine_id       : 1,
                supplier_id       : 1,
                medicine_name     : 1,
                composition       : 1,
                dossier_type      : 1,
                dossier_status    : 1,
                stocked_in        : 1,
                medicine_type     : 1,
                gmp_approvals     : 1,
                shipping_time     : 1,
                tags              : 1,
                available_for     : 1,
                description       : 1,
                medicine_image    : 1,
                drugs_name        : 1,
                country_of_origin : 1,
                registered_in     : 1,
                comments          : 1,
                dosage_form       : 1,
                category_name     : 1,
                strength          : 1,
                quantity          : 1,
                inventory_info    : 1,
                productInventory : {
                  $arrayElemAt: ["$productInventory", 0],
                },
              },
            },
            { $skip: offset },
            { $limit: page_size },
          ])
            .then((data) => {
              Medicine.countDocuments({supplier_id : supplier_id})
              .then(totalItems => {

                  const totalPages = Math.ceil(totalItems / page_size);
                  const returnObj = {
                    data,
                    totalPages,
                    totalItems
                  }
                  callback({ code: 200, message: "Supplier product list fetched successfully", result: returnObj });
              })
              .catch((err) => {
                callback({code: 400, message: "Error while fetching supplier product list", result: err});
              })
            })
            .catch((err) => {
              console.log(err);
              callback({ code: 400, message: "Error fetching medicine list", result: err});
            });
      } catch (error) {
        console.log(error);
        callback({ code: 500, message: "Internal Server Error", result: error });
      }
    },

    buyerSupplierOrdersList : async(reqObj, callback) => {
      try {
        const { supplier_id, buyer_id, pageNo, pageSize, order_type } = reqObj

        const page_no   = pageNo || 1
        const page_size = pageSize || 2
        const offset    = (page_no - 1) * page_size

        const orderTypeMatch = order_type ? { order_status: order_type } : {};

        Order.aggregate([
          {
            $match: {
              buyer_id    : buyer_id,
              supplier_id : supplier_id,
            }
          },
          {
            $facet: {
              completedCount: [
                {$match: {order_status : 'completed'}},
                {$count: 'completed'}
              ],
              activeCount: [
                {$match: {order_status : 'active'}},
                {$count: 'active'}
              ],
              pendingCount: [
                {$match: {order_status : 'pending'}},
                {$count: 'pending'}
              ],
              orderList: [
                { $match : orderTypeMatch },
                { $sort  : { created_at: -1 } },
                { $skip  : offset },
                { $limit : page_size },
                {
                  $project: {
                    order_id     : 1,
                    buyer_id     : 1,
                    supplier_id  : 1,
                    items        : 1,
                    order_status : 1,
                    created_at   : 1
                  }
                }
              ],
              totalOrders: [
                { $match: orderTypeMatch },
                { $count: 'total' }
              ]
            }
          },
        ]).then((data) => {
          const resultObj = {
            completedCount : data[0]?.completedCount[0]?.completed || 0,
            activeCount    : data[0]?.activeCount[0]?.active || 0,
            pendingCount   : data[0]?.pendingCount[0]?.pending || 0,
            orderList      : data[0]?.orderList,
            totalOrders    : data[0]?.totalOrders[0]?.total || 0
          }
          callback({code: 200, message : 'buyer supplier order list fetched successfully', result: resultObj})
        })
        .catch((err) => {
          console.log(err);
          callback({code: 400, message : 'error while fetching buyer supplier order list', result: err})
        })
      } catch (error) {
        console.log('Internal Server Error', error)
        callback({code: 500, message : 'Internal server error', result: error})
      }
    },

    buyerDashboardOrderDetails : async(reqObj, callback) => {
      try {
        const { buyer_id } = reqObj

        Order.aggregate([
          {
            $match : {buyer_id : buyer_id}
          },
          {
            $addFields: {
              numeric_total_price: {
                $toDouble: {
                  $arrayElemAt: [
                    { $split: ["$total_price", " "] },
                    0
                  ]
                }
              }
            }
          },
          {
            $facet: {
              completedCount: [
                {$match: {order_status : 'completed'}},
                { 
                  $group: {
                    _id            : null,
                    count          : { $sum: 1 },
                    total_purchase : { $sum: "$numeric_total_price" }
                  }
                },
                { 
                  $project: {
                    _id            : 0,
                    count          : 1,
                    total_purchase : 1
                  }
                }
              ],
              activeCount: [
                {$match: {order_status : 'active'}},
                { 
                  $group: {
                    _id            : null,
                    count          : { $sum: 1 },
                    total_purchase : { $sum: "$numeric_total_price" }
                  }
                },
                { 
                  $project: {
                    _id            : 0,
                    count          : 1,
                    total_purchase : 1
                  }
                }
              ],
              pendingCount: [
                {$match: {order_status : 'pending'}},
                { 
                  $group: {
                    _id            : null,
                    count          : { $sum: 1 },
                    total_purchase : { $sum: "$numeric_total_price" }
                  }
                },
                { 
                  $project: {
                    _id            : 0,
                    count          : 1,
                    total_purchase : 1
                  }
                }
              ],
              totalPurchaseAmount: [
                { 
                  $group: {
                    _id            : null,
                    total_purchase : { $sum: "$numeric_total_price" }
                  }
                },
                { 
                  $project: {
                    _id            : 0,
                    total_purchase : 1
                  }
                }
              ]
            }
          }
        ])
        .then((data) => {
          callback({code: 200, message : 'buyer dashoard order details fetched successfully', result: data[0]})
        })
        .catch((err) => {
          console.log(err);
          callback({code: 400, message : 'error while fetching buyer dashboard order details', result: err})
        })
      } catch (error) {
        console.log('Internal Server Error', error)
        callback({code: 500, message : 'Internal server error', result: error})
      }
    },

    buyerOrderSellerCountry : async(reqObj, callback) => {
      try {
        const { buyer_id } = reqObj

        Order.aggregate([
          {
            $match: {buyer_id : buyer_id}
          },
          {
            $lookup: {
              from         : 'suppliers',
              localField   : 'supplier_id',
              foreignField : 'supplier_id',
              as           : 'supplier'
            }
          },
          {
            $unwind: '$supplier'
          },
          {
            $addFields: {
              numeric_total_price: {
                $toDouble: {
                  $arrayElemAt: [
                    { $split: ["$total_price", " "] },
                    0
                  ]
                }
              }
            }
          },
          {
            $group: {
              _id            : '$supplier.country_of_origin',
              total_purchase : { $sum: '$numeric_total_price' }
            }
          },
          {
            $project: {
              _id     : 0,
              country : '$_id',
              value   : '$total_purchase'
            }
          }
        ])
        .then((data) => {
          callback({code: 200, message : 'buyer seller country fetched successfully', result: data})
        })
        .catch((err) => {
          callback({code: 400, message : 'error while fetching buyer seller country', result: err})
        })
      } catch (error) {
        console.log('Internal Server Error', error)
        callback({code: 500, message : 'Internal server error', result: error})
      }
    },

    //----------------------------- support -------------------------------------//
    supportList : async(reqObj, callback) => {
     try {
        const { buyer_id, pageNo, pageSize } = reqObj

        const page_no   = pageNo || 1
        const page_size = pageSize || 1
        const offset    = (page_no - 1) * page_size 

        Support.find({buyer_id : buyer_id}).skip(offset).limit(page_size).then((data) => {
          Support.countDocuments({buyer_id : buyer_id}).then((totalItems) => {
            const totalPages = Math.ceil(totalItems / page_size)
            const returnObj =  {
              data,
              totalPages
            }
            callback({code: 200, message : 'buyer support list fetched successfully', result: returnObj})
          })
          .catch((err) => {
            console.log(err);
            callback({code: 400, message : 'error while fetching buyer support list count', result: err})
          })
        })
        .catch((err) => {
          console.log(err);
          callback({code: 400, message : 'error while fetching buyer support list', result: err})
        })

     } catch (error) {
      callback({code: 500, message : 'Internal Server Error', result: error})
     }
    },

    supportDetails : async (reqObj, callback) => {
      try {
         const { buyer_id , support_id } = reqObj

         Support.find({buyer_id, support_id : support_id}).select().then((data) => {
          callback({code: 200, message : 'buyer support list fetched successfully', result: data})
         })
      } catch (error) {
        
      }
    },
    //----------------------------- support --------------------------------------//

    addToList : async (reqObj, callback) => {
      try {
        const existingList = await List.findOne({
          buyer_id    : reqObj.buyer_id,
          supplier_id : reqObj.supplier_id,
        });
    
        if (existingList) {
          existingList.item_details.push({
            medicine_id       : reqObj.medicine_id,
            quantity          : reqObj.quantity,
            unit_price        : reqObj.unit_price,
            est_delivery_days : reqObj.est_delivery_time,
            quantity_required : reqObj.quantity_required,
            target_price      : reqObj.target_price
          });
    
          existingList.save()
            .then(async(data) => {
              const listCount = await List.countDocuments({buyer_id: reqObj.buyer_id})
              // console.log("listCount",listCount)
              // data.list_count = listCount
              callback({ code: 200, message: "Added to existing list successfully", result: data });
            })
            .catch((err) => {
              callback({ code: 400, message: "Error while adding to existing list", result: err });
            });
        } else {

          const listId = 'LST-' + Math.random().toString(16).slice(2);
    
          const newList = new List({
            list_id     : listId,
            buyer_id    : reqObj.buyer_id,
            supplier_id : reqObj.supplier_id,
            item_details: [{
              medicine_id       : reqObj.medicine_id,
              quantity          : reqObj.quantity,
              unit_price        : reqObj.unit_price,
              est_delivery_days : reqObj.est_delivery_time,
              quantity_required : reqObj.quantity_required,
              target_price      : reqObj.target_price
            }]
          });
    
          newList.save()
            .then(async(data) => {
              const listCount = await List.countDocuments({buyer_id: reqObj.buyer_id})
              data.list_count = listCount
              callback({ code: 200, message: "Added to new list successfully", result: data });
            })
            .catch((err) => {
              callback({ code: 400, message: "Error while adding to new list", result: err });
            });
        }
      } catch (error) {
        console.log('Internal server error', error);
        callback({ code: 500, message: "Internal server error", result: error });
      }
    },

    showList : async(reqObj, callback) => {
      try {
        const { buyer_id, pageNo, pageSize } = reqObj

        const page_no   = pageNo || 1
        const page_size = pageSize || 1
        const offset    = (page_no - 1) * page_size 

        List.aggregate([
          {
            $match: {
              buyer_id: buyer_id
            }
          },
          {
            $unwind: "$item_details"
          },
          {
            $lookup: {
              from         : "medicines",
              localField   : "item_details.medicine_id",
              foreignField : "medicine_id",
              as           : "medicine_details"
            }
          },
          {
            $unwind: "$medicine_details"
          },
          {
            $lookup: {
              from         : "suppliers",
              localField   : "medicine_details.supplier_id",
              foreignField : "supplier_id",
              as           : "supplier_details"
            }
          },
          {
            $group: {
              _id: "$_id",
              list_id     : { $first : "$list_id" },
              buyer_id    : { $first : "$buyer_id" },
              supplier_id : { $first : "$supplier_id" },
              supplier_details : { $first: { $arrayElemAt: ["$supplier_details", 0] } }, 
              item_details : {
                $push: {
                  _id               : "$item_details._id",
                  medicine_id       : "$item_details.medicine_id",
                  quantity          : "$item_details.quantity",
                  unit_price        : "$item_details.unit_price",
                  est_delivery_days : "$item_details.est_delivery_days",
                  quantity_required : "$item_details.quantity_required",
                  target_price      : "$item_details.target_price",
                  medicine_image    : "$medicine_details.medicine_image",
                  medicine_name     : "$medicine_details.medicine_name"
                }
              }
            }
          },
          {
            $project: {
              _id          : 0,
              list_id      : 1,
              buyer_id     : 1,
              supplier_id  : 1,
              item_details : 1,
              "supplier_details.supplier_id"    : 1,
              "supplier_details.supplier_name"  : 1,
              "supplier_details.supplier_image" : 1,
            }
          },
          { $skip  : offset },
          { $limit : page_size },
          { $sort  : {created_at: -1} }
        ])
        
        .then( async(data) => {
          const totalItems = await List.countDocuments({buyer_id: buyer_id});
          const totalPages = Math.ceil(totalItems / page_size);

          const returnObj = {
              data,
              totalPages,
              totalItems
          };
          callback({code: 200, message: "List fetched successfully", result: returnObj})
        })
        .catch((err) => {
          console.log(err);
          callback({code: 400, message : 'error while fetching buyer list', result: err})
        })
      } catch (error) {
        
      }
    },

    deleteListItem: async (reqObj, callback) => {
      try {
        const { buyer_id, medicine_id, supplier_id, item_id, list_id } = reqObj;
        const itemIds = item_id.map(id => id.trim()).filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    
        if (itemIds.length === 0) {
          return callback({ code: 400, message: "No valid item IDs provided", result: null });
        }
    
        const updateQuery = {
          $pull: { item_details: { _id: { $in: itemIds } } }
        };

        const updateResult = await List.updateMany({ buyer_id: buyer_id }, updateQuery);
    
        if (updateResult.modifiedCount === 0) {
          return callback({ code: 400, message: "No items were updated", result: updateResult });
        }

        const updatedDocuments = await List.find({ buyer_id: buyer_id });
    
        for (const doc of updatedDocuments) {
          if (doc.item_details.length === 0) {
            await List.deleteOne({ _id: doc._id });
          }
        }
    
        callback({ code: 200, message: "Deleted Successfully", result: updateResult });
      } catch (error) {
        console.log('Internal server error', error);
        callback({ code: 500, message: "Internal server error", result: error });
      }
    },

    sendEnquiry: async (reqObj, callback) => {
      try {
        const { buyer_id, items } = reqObj;
        if (!buyer_id || !items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Invalid request object');
        }

        const groupedItems = items.reduce((acc, item) => {
            const { supplier_id, list_id, item_details } = item;
            if (!supplier_id || !item_details || !Array.isArray(item_details) || item_details.length === 0) {
                throw new Error('Missing required item details');
            }

            item_details.forEach(detail => {
                const { medicine_id, unit_price, quantity_required, est_delivery_days, target_price, item_id } = detail;
                if (!medicine_id || !unit_price || !quantity_required || !est_delivery_days || !target_price) {
                    throw new Error('Missing required item fields');
                }
                if (!acc[supplier_id]) {
                    acc[supplier_id] = [];
                }
                acc[supplier_id].push({
                    item_id,
                    medicine_id,
                    unit_price,
                    quantity_required,
                    est_delivery_days,
                    target_price,
                    counter_price: detail.counter_price || undefined,
                    status: detail.status || 'pending'
                });
            });
            return acc;
        }, {});

        const enquiries = Object.keys(groupedItems).map(supplier_id => ({
            enquiry_id: 'ENQ-' + Math.random().toString(16).slice(2),
            buyer_id,
            supplier_id,
            items: groupedItems[supplier_id]
        }));

        // enquiries.forEach(enquiry => {
        //     console.log('Enquiry:', enquiry);
        //     enquiry.items.forEach(item => {
        //         console.log('Item:', item);
        //     });
        // });

        const enquiryDocs = await Enquiry.insertMany(enquiries);

        await Promise.all(items.map(async item => {
            const { list_id, item_details } = item;

            for (const detail of item_details) {
                const { item_id } = detail;
                
                const objectId = ObjectId.isValid(item_id) ? new ObjectId(item_id) : null;

                await List.updateOne(
                    { list_id },
                    { $pull: { item_details: { _id: objectId } } }
                );

                const updatedList = await List.findOne({ list_id });
                if (updatedList && updatedList.item_details.length === 0) {
                    await List.deleteOne({ list_id });
                }
            }
        }));

        const notifications = enquiries.map(enquiry => {
          const notificationId = 'NOT-' + Math.random().toString(16).slice(2);
          return {
            notification_id: notificationId,
            event_type: 'Enquiry Request',
            event : 'enquiry',
            from: 'buyer',
            to: 'supplier',
            from_id: buyer_id,
            to_id: enquiry.supplier_id,
            event_id: enquiry.enquiry_id,  // Use the enquiry_id here
            message: 'New enquiry request',
            status: 0
          };
        });
    
        await Notification.insertMany(notifications);

        callback({ code: 200, message: "Enquiries sent successfully", result: enquiryDocs });

      } catch (error) {
        console.log('Internal server error', error);
        callback({ code: 500, message: "Internal server error", result: error });
      }
    },


    getNotificationList : async(reqObj, callback) => {
      try {
        const { buyer_id, pageNo, pageSize } = reqObj

        const page_no   = pageNo || 1
        const page_size = pageSize || 100
        const offset    = (page_no - 1) * page_size 

        Notification.aggregate([
          {
            $match: {
              to_id: buyer_id,
              to : 'buyer'
              
            }
          },
          { $sort  : {created_at: -1} },
          { $skip  : offset },
          { $limit : page_size },
          
        ])
        
        .then( async(data) => {
          const totalItems = await Notification.countDocuments({to_id: buyer_id, to: 'buyer'});
          const totalPages = Math.ceil(totalItems / page_size);

          const returnObj = {
              data,
              totalPages,
              totalItems
          };
          callback({code: 200, message: "List fetched successfully", result: returnObj})
        })
        .catch((err) => {
          console.log(err);
          callback({code: 400, message : 'error while fetching buyer list', result: err})
        })
      } catch (error) {
        
      }
    },

    updateStatus : async(reqObj, callback) => {
      try {
        const { notification_id, status } = reqObj

        const updateNotification = await Notification.findOneAndUpdate(
          { notification_id : notification_id },
          {
              $set: {
                status: status,
                // status            : 'Awaiting Details from Seller'
              }
          },
          { new: true } 
      );
      if (!updatedOrder) {
          return callback({ code: 404, message: 'Order not found', result: null });
      }
      } catch (error) {
        
      }
    },
    
}

