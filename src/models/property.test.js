const Property = require('../models/property');
const LISTING_TYPES = require('../constants/listingTypes');
const PROPERTY_TYPES = require('../constants/propertyTypes');

describe('Property Schema Tests', () => {
  describe('Listing Type Field', () => {
    Object.values(LISTING_TYPES).forEach((listingType) => {
      it(`should be valid with listingType '${listingType}'`, () => {
        const property = new Property({ listingType });
        const error = property.validateSync();
        expect(property['_doc'].listingType).toEqual(listingType);
        expect(error.errors['listingType']).toBeUndefined();
      });
    });

    it('should be invalid if listingType is not a string', () => {
      const value = 123;
      const property = new Property({ listingType: value });
      const response = property.validateSync();
      expect(response.errors['listingType']).toBeDefined();
      expect(response.errors['listingType'].message).toEqual(`${value} is not a valid listing type`);
    });

    it('should be invalid if listingType is not in the enum', () => {
      const property = new Property({ listingType: 'invalidType' });
      const response = property.validateSync();
      expect(response.errors['listingType']).toBeDefined();
      expect(response.errors['listingType'].message).toEqual('invalidType is not a valid listing type');
    });

    it('should error if listingType is not provided', () => {
      const property = new Property({});
      const response = property.validateSync();
      expect(response.errors['listingType']).toBeDefined();
      expect(response.errors['listingType'].message).toEqual('Listing type is required');
    });
  });

  describe('Price For Rent Field', () => {
    it('should be valid with a positive price when listingType is rent', () => {
      const property = new Property({ listingType: LISTING_TYPES.RENT, priceForRent: 1000 });
      const response = property.validateSync();
      expect(property._doc.listingType).toEqual('rent');
      expect(property._doc.priceForRent).toEqual(1000);
      expect(response.errors['priceForRent']).toBeUndefined();
    });

    it('should be required if listingType is rent', () => {
      const property = new Property({ listingType: LISTING_TYPES.RENT });
      const response = property.validateSync();
      expect(response.errors['priceForRent']).toBeDefined();
      expect(response.errors['priceForRent'].message).toEqual('Price for rent is required for rent listings');
    });

    it('should not be required if listingType is not rent', () => {
      const property = new Property({ listingType: LISTING_TYPES.BUY });
      const response = property.validateSync();
      expect(response.errors['priceForRent']).toBeUndefined();
    });

    it('should error when a negative value is set', () => {
      const property = new Property({ listingType: LISTING_TYPES.RENT, priceForRent: -1 });
      const response = property.validateSync();
      expect(response.errors['priceForRent']).toBeDefined();
      expect(response.errors['priceForRent'].message).toEqual('Price for rent must be a positive value');
    });

    it('should error if priceForRent is not a number', () => {
      const property = new Property({ listingType: LISTING_TYPES.RENT, priceForRent: 'NotANumber' });
      const response = property.validateSync();
      expect(response.errors['priceForRent']).toBeDefined();
      expect(response.errors['priceForRent'].message).toContain('NotANumber');
    });
  });

  describe('Price For Buy Field', () => {
    it('should be valid with a positive price when listingType is buy', () => {
      const property = new Property({ listingType: LISTING_TYPES.BUY, priceForBuy: 1000 });
      expect(property['_doc'].listingType).toEqual('buy');
      expect(property['_doc'].priceForBuy).toEqual(1000);
      const response = property.validateSync();
      expect(response.errors['priceForBuy']).toBeUndefined();
    });

    it('should be required if listingType is buy', () => {
      const property = new Property({ listingType: LISTING_TYPES.BUY });
      const response = property.validateSync();
      expect(response.errors['priceForBuy']).toBeDefined();
      expect(response.errors['priceForBuy'].message).toEqual('Price for buy is required for buy listings');
    });

    it('should not be required if listingType is not buy', () => {
      const property = new Property({ listingType: LISTING_TYPES.RENT });
      const response = property.validateSync();
      expect(response.errors['priceForBuy']).toBeUndefined();
    });
  });

  describe('Property Attributes', () => {
    it('should be valid if yearBuilt is within the allowed range', () => {
      const property = new Property({ propertyAttributes: { yearBuilt: 1966 } });
      const error = property.validateSync();
      expect(property['_doc'].propertyAttributes.yearBuilt).toEqual(1966);
      expect(error.errors['propertyAttributes.yearBuilt']).toBeUndefined();
    });

    it('should be invalid if yearBuilt is in the future', () => {
      const futureYear = new Date().getFullYear() + 10;
      const property = new Property({ propertyAttributes: { yearBuilt: futureYear } });
      const response = property.validateSync();
      expect(response.errors['propertyAttributes.yearBuilt']).toBeDefined();
      expect(response.errors['propertyAttributes.yearBuilt'].message).toEqual('Year built cannot be in the future');
    });

    it('should be invalid if yearBuilt is not a number', () => {
      const property = new Property({ propertyAttributes: { yearBuilt: 'Year' } });
      const response = property.validateSync();
      expect(response.errors['propertyAttributes.yearBuilt']).toBeDefined();
      expect(response.errors['propertyAttributes.yearBuilt'].message).toContain(
        'Cast to Number failed for value "Year"',
      );
    });
  });

  describe('Property Type Field', () => {
    Object.values(PROPERTY_TYPES.rentAndBuyPropertyType).forEach((propertyType) => {
      it(`should be valid with propertyType '${propertyType}'`, () => {
        const property = new Property({ propertyAttributes: { propertyType } });
        const response = property.validateSync();
        expect(property['_doc'].propertyAttributes.propertyType).toEqual(propertyType);
        expect(response.errors['propertyAttributes.propertyType']).toBeUndefined();
      });
    });

    it('should be invalid if propertyType is not provided', () => {
      const property = new Property({});
      const response = property.validateSync();
      expect(response.errors['propertyAttributes.propertyType']).toBeDefined();
      expect(response.errors['propertyAttributes.propertyType'].message).toEqual('Property type is a required field');
    });

    it('should be invalid if propertyType is not a string', () => {
      const property = new Property({ propertyAttributes: { propertyType: 123 } });
      const response = property.validateSync();
      expect(response.errors['propertyAttributes.propertyType']).toBeDefined();
      expect(response.errors['propertyAttributes.propertyType'].message).toEqual(
        '`123` is not a valid enum value for path `propertyAttributes.propertyType`.',
      );
    });
  });
});
