const seeding = {};
const fs = require("fs");
const path = require("path");
const logsFilePath = path.resolve(__dirname, "logs", "index.txt");
const languages = ["ar", "tr", "en"];
const Brand = require("../models/brand.js");
const MasterDescription = require("../models/masterDescription.js");
const ProductCategory = require("../models/ProductCategory.js");
const axios = require("axios");
const FormData = require("form-data");
const ProductCategoryDescription = require("../models/ProductCategoryDescription.js");
const Variant = require("../models/Variant.js");
const SubVariant = require("../models/SubVariant.js");

const logAction = (action, status, error = null) => {
  const currentTime = new Date();
  const logMessage = `${action} - ${status} at ${currentTime.toLocaleString()}`;

  if (error) {
    fs.appendFileSync(
      logsFilePath,
      `${logMessage} - Error: ${error}\n`,
      "utf-8"
    );
  } else {
    fs.appendFileSync(logsFilePath, `${logMessage}\n`, "utf-8");
  }
};

//* 1. Seed all brands ---------------------------------------------
const addBrandDescription = async (brand, languageCode) => {
  try {
    const timestamp = new Date().getTime();
    const uniqueIdentifier = Math.floor(Math.random() * 1000);
    const slug = `${brand.name}-${languageCode}-${timestamp}-${uniqueIdentifier}`;
    await MasterDescription.findOneAndUpdate(
      {
        mainPage: brand._id,
        languageCode: languageCode,
      },
      {
        name: brand.name,
        key: "brand",
        slug: slug,
        mainPage: brand._id,
        languageCode: languageCode,
      },
      {
        new: true,
        upsert: true,
      }
    );
  } catch (err) {
    console.log(err);
    logAction("BrandDescription", "Failed", err);
  }
};

const processBrandsForLanguage = async (languageCode) => {
  try {
    const brandsApiUrl = process.env.BRANDS_API;
    const token = process.env.TSOFT_TOKEN;
    const formData = new FormData();
    formData.append("token", token);
    formData.append("language", languageCode);
    formData.append("limit", 500);

    const axiosConfig = {
      headers: {
        ...formData.getHeaders(),
        "Content-Type": "multipart/form-data",
      },
    };

    const response = await axios.post(brandsApiUrl, formData, axiosConfig);
    const brands = response.data.data;

    // Add brands
    for (const brand of brands) {
      const updatedBrand = await Brand.findOneAndUpdate(
        {
          brandId: brand.BrandId,
        },
        {
          name: brand.BrandName,
          brandId: brand.BrandId,
          isActive: true,
          isDeleted: false,
        },
        {
          new: true,
          upsert: true,
        }
      );
      await addBrandDescription(updatedBrand, languageCode);
    }

    console.log(`Completed processing brands for ${languageCode}`);
  } catch (err) {
    console.log(err);
    logAction(`Failed processing brands for ${languageCode}`, "Failed", err);
  }
};

seeding.seedBrands = async () => {
  try {
    logAction("Brands", "Started");
    await Promise.all(languages.map(processBrandsForLanguage));
    logAction("Brands", "Completed");
  } catch (err) {
    console.log(err);
    logAction("Brands", "Failed", err);
  }
};

//* 2. Seed all categories ------------------------------------------

const updateCategoryDescriptionsRecursive = async (savedCategory, languageCode) => {
  try {
    const formData = new FormData();
    const token = process.env.TSOFT_TOKEN;
    formData.append("token", token);
    formData.append("language", languageCode);
    const axiosConfig = {
      headers: {
        ...formData.getHeaders(),
        "Content-Type": "multipart/form-data",
      },
    };
    const url = process.env.GET_SINGLE_CATEGORY_BY_CATEGORY_ID_API;
    const response = await axios.post(`${url}/${savedCategory.categoryId}`, formData, axiosConfig);
    const category = response.data.data;
    await ProductCategoryDescription.findOneAndUpdate(
      {
        productCategoryId: savedCategory._id,
        languageCode: languageCode,
      },
      {
        productCategoryId: savedCategory._id,
        languageCode: languageCode,
        name: category.CategoryName,
        slug: category.CategoryName + Math.random().toString(36).substr(2, 9),
      },
      {
        new: true,
        upsert: true,
      }
    );
  } catch (error) {
    logAction("CategoryDescriptions", "Failed", error);
    console.error("Error updating CategoryDescriptions:", error);
  }
};

const processCategoriesForLanguage = async () => {
  try {
    const categoriesApiUrl = process.env.CATEGORIES_API;
    const token = process.env.TSOFT_TOKEN;
    let start = 0;
    let limit = 500;
    while (true) {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("start", start);
      formData.append("limit", limit);
      formData.append("language", "en");
      const axiosConfig = {
        headers: {
          ...formData.getHeaders(),
          "Content-Type": "multipart/form-data",
        },
      };
      const response = await axios.post(
        categoriesApiUrl,
        formData,
        axiosConfig
      );
      const categories = response.data.data;
      if (!categories || typeof categories !== "object") {
        break;
      }
      // Add categories
      const createCategory = async (
        categoryData,
        depth = 0,
        parentId = null
      ) => {
        try {
          const savedCategory = await ProductCategory.findOneAndUpdate(
            { categoryId: categoryData.CategoryId },
            {
              categoryId: categoryData.CategoryId,
              name: categoryData.CategoryName,
              order: depth,
              parentId: parentId,
            },
            {
              new: true,
              upsert: true,
            }
          );
          for (const languageCode of languages) {
            await updateCategoryDescriptionsRecursive(
              savedCategory,
              languageCode
            );
          }
          const children = categories.filter(
            (child) =>
              String(child.ParentCode) === String(categoryData.CategoryId)
          );
          for (const child of children) {
            await createCategory(child, depth + 1, savedCategory._id);
          }
        } catch (error) {
          console.error("Error creating category:", error);
        }
      };
      const baseCategories = categories.filter(
        (category) => category.ParentCode === "0" || !category.ParentCode
      );
      for (const category of baseCategories) {
        await createCategory(category);
      }
      start += limit;
    }

    console.log(`Completed processing categories for ${languageCode}`);
  } catch (err) {
    console.log(err);
    logAction(
      `Failed processing categories for ${languageCode}`,
      "Failed",
      err
    );
  }
};

seeding.seedCategories = async () => {
  try {
    logAction("Categories", "Started");
    await processCategoriesForLanguage();
    logAction("Categories", "Completed");
  } catch (err) {
    logAction("Categories", "Failed", err);
  }
};

//* 3. Seed all units -----------------------------------------------
seeding.seedUnits = async () => {
  // Your seeding logic for units goes here
};

//* 4. Seed all products --------------------------------------------
// const updateProductDescriptionsRecursive = async (data, parentCategoryId = null, languageCode) => {
//     try {
//         await Promise.all(data.map(async (item) => {
//             try {
//                 const category = await ProductCategory.findOne({ categoryId: item.category_id });

//                 if (category) {
//                     const FoundProductDescription = await MasterDescription.findOne({
//                         productCategoryId: category._id,
//                         languageCode: languageCode
//                     });
//                     if (!FoundProductDescription) {
//                         const newData = new ProductDescription({
//                             productCategoryId: category._id,
//                             languageCode: languageCode,
//                             name: item.text,
//                             slug: item.text + Math.random().toString(36).substr(2, 9),
//                         });
//                         await newData.save();
//                         if (item.children && item.children.length > 0) {
//                             await updateProductDescriptionsRecursive(item.children, category._id, languageCode);
//                         }
//                     }
//                 }
//             } catch (error) {
//                 console.error('Error updating ProductDescriptions for category:', item.category_id, error);
//             }
//         }));
//     } catch (error) {
//         console.error('Error updating ProductDescriptions:', error);
//     }
// }

// try {
//     await updateProductDescriptionsRecursive(enData, null, "en");
//     await updateProductDescriptionsRecursive(arData, null, "ar");
//     await updateProductDescriptionsRecursive(trData, null, "tr");
// } catch (error) {
//     console.error('Error updating ProductDescriptions:', error);
// }

seeding.seedProducts = async () => {
  // Your seeding logic for products goes here
};

//* 5. Seed all variants --------------------------------------------
const updateProducts = async () => {
  try {

  }
  catch(err) {
    logAction("updateUpdatingProductVariants", "Failed", err);
    console.log(`Error while updating variants: ${err}`);
  }
} 

const updateCategories = async (languageCode) => {
  let start = 0;
  let limit = 500;
  try {
    const productsApiUrl = process.env.PRODUCTS_GET_API;
    const productsApiToken = process.env.TSOFT_TOKEN;
    while (true) {
      const formData = new FormData();
      formData.append("token", productsApiToken);
      formData.append("start", start);
      formData.append("limit", limit);

      const axiosConfig = {
        headers: {
          ...formData.getHeaders(),
          "Content-Type": "multipart/form-data",
        },
      };
      const response = await axios.post(productsApiUrl, formData, axiosConfig);
      const products = response.data.data;
      if (typeof products !== "object" || !products || products.length === 0) {
        break;
      }
      await Promise.all(
        products.map(async (product) => {
          const categoryId = product.DefaultCategoryId;
          if (categoryId) {
            const foundCategory = await ProductCategory.findOne({
              categoryId: categoryId,
            });

            if (foundCategory) {
              let variantIds = [];
              if (product.VariantFeature1Title) {
                const foundVariant1 = await Variant.findOne({
                  name: product.VariantFeature1Title,
                });
                variantIds.push(foundVariant1?._id);
              }
              if (product.VariantFeature2Title) {
                const foundVariant2 = await Variant.findOne({
                  name: product.VariantFeature2Title,
                });
                variantIds.push(foundVariant2?._id);
              }
              if (product.VariantFeature3Title) {
                const foundVariant3 = await Variant.findOne({
                  name: product.VariantFeature2Title,
                });
                variantIds.push(foundVariant3?._id);
              }

              await ProductCategory.findOneAndUpdate(
                {
                  categoryId: categoryId,
                },
                {
                  ...foundCategory.toObject(),
                  variantIds: variantIds,
                  variantFilterIds: variantIds,
                  masterVariantId: variantIds[0],
                },
                {
                  new: true,
                }
              );
            }
          }
        })
      );

      start += limit;
    }
  } catch (err) {
    logAction("updateVariantProperties", "Failed", err);
    console.log(`Error while updating variant properties: ${err}`);
  }
};

const updateVariants = async (variants, languageCode) => {
  try {
    for (const variant of variants) {
      const newVariant = await Variant.findOneAndUpdate(
        { groupId: variant.GroupId },
        { name: variant.Name, groupId: variant.GroupId },
        { new: true, upsert: true }
      );

      await MasterDescription.findOneAndUpdate(
        { mainPage: newVariant._id, languageCode: languageCode },
        {
          mainPage: newVariant._id,
          key: "variant",
          languageCode,
          name: newVariant.name,
        },
        { new: true, upsert: true }
      );
    }
  } catch (err) {
    console.log(`Error while updating variants: ${err}`);
    logAction("updateVariants", "Failed", err);
  }
};

const updateVariantProperties = async (variantPropertiesData, languageCode) => {
  try {
    for (const property of variantPropertiesData) {
      const variant = await Variant.findOne({ groupId: property.GroupId });

      if (variant) {
        const newSubVariant = await SubVariant.findOneAndUpdate(
          { variantId: variant._id, propertyId: property.PropertyId },
          { name: property.Property, groupId: variant.GroupId },
          { new: true, upsert: true }
        );

        await MasterDescription.updateOne(
          { mainPage: newSubVariant._id, languageCode: languageCode },
          {
            mainPage: newSubVariant._id,
            key: "subVariant",
            languageCode,
            name: newSubVariant.name,
          },
          { new: true, upsert: true }
        );
      }
    }
  } catch (err) {
    console.log(`Error while updating VariantProperties: ${err}`);
    logAction("VariantProperties", "Failed", err);
  }
};

const processVariantPropertiesForLanguage = async (languageCode) => {
  try {
    let start = 0;
    let limit = 500;
    let variantValuesApiUrl = process.env.VARIANT_VALUES_API;

    while (true) {
      const formData = new FormData();
      formData.append("token", process.env.TSOFT_TOKEN);
      formData.append("start", start);
      formData.append("limit", limit);
      formData.append("language", languageCode);

      const axiosConfig = {
        headers: {
          ...formData.getHeaders(),
          "Content-Type": "multipart/form-data",
        },
      };

      const response = await axios.post(
        variantValuesApiUrl,
        formData,
        axiosConfig
      );
      const variantPropertiesData = response.data.data;

      if (!variantPropertiesData || variantPropertiesData.length === 0) {
        break;
      }

      await updateVariantProperties(variantPropertiesData, languageCode);
      start += limit;
    }

    console.log(`Completed processing variant properties for ${languageCode}`);
  } catch (err) {
    console.log(
      `Error while processing variant properties for ${languageCode}: ${err}`
    );
  }
};

const processVariantsForLanguage = async (languageCode) => {
  try {
    let start = 0;
    let limit = 500;
    let variantGroupApiUrl = process.env.VARIANTS_GROUP_API;

    // while (true) {
      const formData = new FormData();
      formData.append("token", process.env.TSOFT_TOKEN);
      formData.append("start", start);
      formData.append("limit", limit);
      formData.append("language", languageCode);

      const axiosConfig = {
        headers: {
          ...formData.getHeaders(),
          "Content-Type": "multipart/form-data",
        },
      };

      const response = await axios.post(
        variantGroupApiUrl,
        formData,
        axiosConfig
      );
      const variants = response.data.data;

      // if (!variants || variants.length === 0) {
      //   break;
      // }

      await updateVariants(variants, languageCode);
      // start += limit;
    // }

    console.log(`Completed processing variants for ${languageCode}`);
  } catch (err) {
    console.log(`Error while processing variants for ${languageCode}: ${err}`);
  }
};

seeding.seedVariants = async () => {
  try {
    logAction("Variants", "Started");
    console.log("Variants seeding started");

    await Promise.all(languages.map(processVariantsForLanguage));
    await Promise.all(languages.map(processVariantPropertiesForLanguage));
    await Promise.all(languages.map(updateCategories));
    await updateProducts();

    logAction("Variants", "Completed");
    console.log("Variants seeding completed");
  } catch (err) {
    logAction("Variants", "Failed", err);
    console.log(`Some error occurred while seeding variants: ${err}`);
  }
};



module.exports = seeding;
