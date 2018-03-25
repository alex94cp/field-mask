const {expect} = require('chai');

const {FieldMask, FieldMaskType} = require('.');

describe('FieldMask', () => {
	describe('include', () => {
		it('returns include mask', function () {
			const mask = FieldMask.include([]);
			expect(mask.type).to.equal(FieldMaskType.Include);
		});

		it('adds given fields to returned mask', function () {
			const mask = FieldMask.include(['foo']);
			expect(mask.includes('foo')).to.be.true;
			expect(mask.includes('bar')).to.be.false;
		});
	});

	describe('exclude', () => {
		it('returns exclude mask', function () {
			const mask = FieldMask.exclude([]);
			expect(mask.type).to.equal(FieldMaskType.Exclude);
		});

		it('adds given fields to returned mask', function () {
			const mask = FieldMask.exclude(['foo']);
			expect(mask.includes('foo')).to.be.false;
			expect(mask.includes('bar')).to.be.true;
		});
	});

	describe('from', () => {
		it('returns field mask from field mask instance', function () {
			const source = new FieldMask;
			source.add('foo', 'bar', 'baz');
			const result = FieldMask.from(source);
			expect(result).to.equal(source);
		});

		it('returns include mask with all fields from array', function () {
			const mask = FieldMask.from(['foo', 'bar', 'baz']);
			expect(mask.type).to.equal(FieldMaskType.Include);
			expect(mask.includes('foo')).to.be.true;
			expect(mask.includes('bar')).to.be.true;
			expect(mask.includes('baz')).to.be.true;
		});

		it('returns include mask from object if all values are truthy', function () {
			const mask = FieldMask.from({ foo: 1 });
			expect(mask.type).to.equal(FieldMaskType.Include);
		});

		it('returns exclude mask from object if all values are falsey', function () {
			const mask = FieldMask.from({ foo: 0 });
			expect(mask.type).to.equal(FieldMaskType.Exclude);
		});

		it('returns empty include mask from empty array', function () {
			const mask = FieldMask.from([]);
			expect(mask.type).to.equal(FieldMaskType.Include);
		});

		it('returns empty exclude mask from empty object', function () {
			const mask = FieldMask.from({});
			expect(mask.type).to.equal(FieldMaskType.Exclude);
		});

		it('throws if object has mixed values', function () {
			expect(() => {
				FieldMask.from({ foo: 1, bar: 0 });
			}).to.throw(Error);
		});
	});

	describe('includes', () => {
		it('returns true if field is included in include mask', function () {
			const mask = FieldMask.include(['foo']);
			expect(mask.includes('foo')).to.be.true;
		});

		it('returns true if field is not included in exclude mask', function () {
			const mask = FieldMask.exclude(['foo']);
			expect(mask.includes('bar')).to.be.true;
		});

		it('returns false if field is not included in include mask', function () {
			const mask = FieldMask.include(['foo']);
			expect(mask.includes('bar')).to.be.false;
		});

		it('returns false if field is included in exclude mask', function () {
			const mask = FieldMask.exclude(['foo']);
			expect(mask.includes('foo')).to.be.false;
		});
	});

	describe('excludes', () => {
		it('returns false if field is included in include mask', function () {
			const mask = FieldMask.include(['foo']);
			expect(mask.excludes('foo')).to.be.false;
		});

		it('returns false if field is not included in exclude mask', function () {
			const mask = FieldMask.exclude(['foo']);
			expect(mask.excludes('bar')).to.be.false;
		});

		it('returns true if field is not included in include mask', function () {
			const mask = FieldMask.include(['foo']);
			expect(mask.excludes('bar')).to.be.true;
		});

		it('returns true if field is included in exclude mask', function () {
			const mask = FieldMask.exclude(['foo']);
			expect(mask.excludes('foo')).to.be.true;
		});
	});

	describe('equals', () => {
		it('returns false if field masks have different types', function () {
			const mask = FieldMask.include(['foo']);
			const other = FieldMask.exclude(['foo']);
			expect(mask.equals(other)).to.be.false;
		});

		it('returns false if field masks have different fields', function () {
			const mask = FieldMask.include(['foo']);
			const other = FieldMask.include(['bar']);
			expect(mask.equals(other)).to.be.false;
		});

		it('returns true if field have same type and fields', function () {
			const mask = FieldMask.include(['foo']);
			const other = FieldMask.include(['foo']);
			expect(mask.equals(other)).to.be.true;
		});
	});

	describe('get', () => {
		it('returns object with all included fields set to 1 from include mask', function () {
			const result = FieldMask.include(['foo', 'bar', 'baz']).get();
			expect(result).to.have.property('foo', 1);
			expect(result).to.have.property('bar', 1);
			expect(result).to.have.property('baz', 1);
		});

		it('returns object with all included fields set to 0 from exclude mask', function () {
			const result = FieldMask.exclude(['foo', 'bar', 'baz']).get();
			expect(result).to.have.property('foo', 0);
			expect(result).to.have.property('bar', 0);
			expect(result).to.have.property('baz', 0);
		});
	});

	describe('negate', () => {
		it('returns exclude mask from include mask', function () {
			const source = FieldMask.include(['foo']);
			const result = source.negate();
			expect(result.type).to.equal(FieldMaskType.Exclude);
			expect(result).to.satisfy(r => !r.includes('foo'));
		});

		it('returns include mask from exclude mask', function () {
			const source = FieldMask.exclude(['foo']);
			const result = source.negate();
			expect(result.type).to.equal(FieldMaskType.Include);
			expect(result).to.satisfy(r => r.includes('foo'));
		});
	});

	describe('join', () => {
		it('returns include mask from include mask and include mask', function () {
			const mask = FieldMask.include(['foo']);
			const result = mask.join({ bar: 1 });
			expect(result.type).to.equal(FieldMaskType.Include);
			expect(result).to.satisfy(r => r.includes('foo'));
			expect(result).to.satisfy(r => r.includes('bar'));
		});

		it('returns include mask from include mask and exclude mask', function () {
			const mask = FieldMask.include(['foo', 'bar']);
			const result = mask.join({ bar: 0, baz: 0 });
			expect(result.type).to.equal(FieldMaskType.Include);
			expect(result).to.satisfy(r => r.includes('foo'));
			expect(result).to.satisfy(r => r.includes('bar'));
			expect(result).to.satisfy(r => !r.includes('baz'));
		});

		it('returns exclude mask from exclude mask and include mask', function () {
			const mask = FieldMask.exclude(['foo', 'bar']);
			const result = mask.join({ bar: 1, baz: 1 });
			expect(result.type).to.equal(FieldMaskType.Exclude);
			expect(result).to.satisfy(r => !r.includes('foo'));
			expect(result).to.satisfy(r => r.includes('bar'));
			expect(result).to.satisfy(r => r.includes('baz'));
		});

		it('returns exclude mask from exclude mask and exclude mask', function () {
			const mask = FieldMask.exclude(['foo']);
			const result = mask.join({ foo: 0, bar: 0 });
			expect(result.type).to.equal(FieldMaskType.Exclude);
			expect(result).to.satisfy(r => !r.includes('foo'));
			expect(result).to.satisfy(r => r.includes('bar'));
		});
	});

	describe('intersect', () => {
		it('returns include mask from include mask and include mask', function () {
			const mask = FieldMask.include(['foo', 'bar']);
			const result = mask.intersect({ bar: 1, baz: 1 });
			expect(result.type).to.equal(FieldMaskType.Include);
			expect(result).to.satisfy(r => !r.includes('foo'));
			expect(result).to.satisfy(r => r.includes('bar'));
			expect(result).to.satisfy(r => !r.includes('baz'));
		});

		it('returns include mask from include mask and exclude mask', function () {
			const mask = FieldMask.include(['foo', 'bar']);
			const result = mask.intersect({ bar: 0, baz: 0 });
			expect(result.type).to.equal(FieldMaskType.Include);
			expect(result).to.satisfy(r => r.includes('foo'));
			expect(result).to.satisfy(r => !r.includes('bar'));
			expect(result).to.satisfy(r => !r.includes('baz'));
		});

		it('returns exclude mask from exclude mask and include mask', function () {
			const mask = FieldMask.exclude(['foo', 'bar']);
			const result = mask.intersect({ bar: 1, baz: 1 });
			expect(result.type).to.equal(FieldMaskType.Exclude);
			expect(result).to.satisfy(r => !r.includes('foo'));
			expect(result).to.satisfy(r => !r.includes('bar'));
			expect(result).to.satisfy(r => r.includes('baz'));
		});

		it('returns exclude mask from exclude mask and exclude mask', function () {
			const mask = FieldMask.exclude(['foo', 'bar']);
			const result = mask.intersect({ bar: 0, baz: 0 });
			expect(result.type).to.equal(FieldMaskType.Exclude);
			expect(result).to.satisfy(r => !r.includes('foo'));
			expect(result).to.satisfy(r => !r.includes('bar'));
			expect(result).to.satisfy(r => !r.includes('baz'));
		});
	});

	describe('apply', () => {
		it('returns object with only included fields', function () {
			const included = FieldMask.include(['foo']);
			const result = included.apply({ foo: 123, bar: 456 });
			expect(result).to.have.property('foo', 123);
			expect(result).to.not.have.property('bar');
		});

		it('returns object without excluded fields', function () {
			const excluded = FieldMask.exclude(['foo']);
			const result = excluded.apply({ foo: 123, bar: 456 });
			expect(result).to.not.have.property('foo');
			expect(result).to.have.property('bar', 456);
		});
	});
});
