export enum FieldMaskType {
	Exclude, Include
}

export class FieldMask<K extends string> {
	private _entries: K[] = [];

	constructor(public type =  FieldMaskType.Include) {
	}

	static from(o: object): FieldMask<string> {
		let resultType = undefined;
		for (const v of Object.values(o)) {
			if (resultType === undefined)
				resultType = v;
			else if (v != resultType)
				throw new Error('Invalid field mask object');
		}
		if (resultType === undefined)
			resultType = FieldMaskType.Include;
		const result = new FieldMask(resultType);
		return result.add(...Object.keys(o));
	}

	add(...fields: K[]): this {
		for (const f of fields) {
			if (!this._entries.includes(f))
				this._entries.push(f);
		}
		return this;
	}

	get(): Record<K, 0 | 1> {
		return this._entries.reduce((result, f) => {
			result[f] = this.type;
			return result;
		}, {} as Record<K, 0 | 1>);
	}

	includes(field: K): boolean | undefined {
		switch (this.type) {
			case FieldMaskType.Exclude:
				return !this._entries.includes(field);
			case FieldMaskType.Include:
				return this._entries.includes(field);
		}
	}

	negate(): FieldMask<K> {
		switch (this.type) {
			case FieldMaskType.Exclude:
				const includeMask = new FieldMask<K>(FieldMaskType.Include);
				includeMask.add(...this._entries);
				return includeMask;
			case FieldMaskType.Include:
				const excludeMask = new FieldMask<K>(FieldMaskType.Exclude);
				excludeMask.add(...this._entries);
				return excludeMask;
		}
	}

	join(other: FieldMask<K>): FieldMask<K> {
		switch (this.type) {
			case FieldMaskType.Exclude:
				const excludeMask = new FieldMask<K>(FieldMaskType.Exclude);
				return excludeMask.add(...this._entries.filter(f => {
					return !other.includes(f);
				}));
			case FieldMaskType.Include:
				const includeMask = new FieldMask<K>(FieldMaskType.Include);
				includeMask.add(...this._entries);
				if (other.type === FieldMaskType.Include)
					includeMask.add(...other._entries);
				return includeMask;
		}
	}

	intersect(other: FieldMask<K>): FieldMask<K> {
		switch (this.type) {
			case FieldMaskType.Exclude:
				const excludeMask = new FieldMask<K>(FieldMaskType.Exclude);
				excludeMask.add(...this._entries);
				if (other.type === FieldMaskType.Exclude)
					excludeMask.add(...other._entries);
				return excludeMask;
			case FieldMaskType.Include:
				const includeMask = new FieldMask<K>(FieldMaskType.Include);
				return includeMask.add(...this._entries.filter(f => {
					return other.includes(f);
				}));
		}
	}
}
