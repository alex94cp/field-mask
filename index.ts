export enum FieldMaskType {
	Exclude, Include
}

export type FieldMaskConvertible<T extends string> = Iterable<T>
                                                   | Record<T, any>
                                                   | FieldMask<T>;

export class FieldMask<K extends string> {
	private _entries: Set<K> = new Set;

	constructor(public type =  FieldMaskType.Include) {
	}

	static exclude<K extends string>(excluded: Iterable<K>): FieldMask<K> {
		const mask = new FieldMask<K>(FieldMaskType.Exclude);
		mask.add(...excluded);
		return mask;
	}

	static include<K extends string>(included: Iterable<K>): FieldMask<K> {
		const mask = new FieldMask<K>(FieldMaskType.Include);
		mask.add(...included);
		return mask;
	}

	static from<K extends string>(from: FieldMaskConvertible<K>): FieldMask<K> {
		if (from instanceof FieldMask) {
			return from;
		} else if (Array.isArray(from)) {
			return FieldMask.include<K>(from);
		} else {
			let maskType = undefined;
			for (const v of Object.values(from)) {
				if (maskType === undefined)
					maskType = v;
				else if (v != maskType)
					throw new Error('Invalid field mask object');
			}
			const mask = new FieldMask<K>(maskType);
			mask.add(...Object.keys(from) as K[]);
			return mask;
		}
	}

	add(...fields: K[]): void {
		fields.forEach(f => this._entries.add(f));
	}

	get(): Record<K, 0 | 1> {
		const result = {} as Record<K, 0 | 1>;
		this._entries.forEach(f => {
			result[f] = this.type;
		});
		return result;
	}

	includes(field: K): boolean {
		switch (this.type) {
			case FieldMaskType.Exclude:
				return !this._entries.has(field);
			case FieldMaskType.Include:
				return this._entries.has(field);
		}
	}

	excludes(field: K): boolean {
		switch (this.type) {
			case FieldMaskType.Exclude:
				return this._entries.has(field);
			case FieldMaskType.Include:
				return !this._entries.has(field);
		}
	}

	negate(): FieldMask<K> {
		switch (this.type) {
			case FieldMaskType.Exclude:
				return FieldMask.include(this._entries);
			case FieldMaskType.Include:
				return FieldMask.exclude(this._entries);
		}
	}

	join(otherFrom: FieldMaskConvertible<K>): FieldMask<K> {
		const entries = [...this._entries];
		const other = FieldMask.from<K>(otherFrom);
		switch (this.type) {
			case FieldMaskType.Exclude:
				return FieldMask.exclude(entries.filter(f => !other.includes(f)));
			case FieldMaskType.Include:
				const includeMask = FieldMask.include(entries);
				if (other.type === FieldMaskType.Include)
					includeMask.add(...other._entries);
				return includeMask;
		}
	}

	intersect(otherFrom: FieldMaskConvertible<K>): FieldMask<K> {
		const entries = [...this._entries];
		const other = FieldMask.from(otherFrom);
		switch (this.type) {
			case FieldMaskType.Exclude:
				const excludeMask = FieldMask.exclude(entries);
				if (other.type === FieldMaskType.Exclude)
					excludeMask.add(...other._entries);
				return excludeMask;
			case FieldMaskType.Include:
				return FieldMask.include(entries.filter(f => other.includes(f)));
		}
	}

	apply<T extends Record<K, any>>(o: T): Pick<T, K> {
		const result = {} as Pick<T, K>;
		switch (this.type) {
			case FieldMaskType.Exclude:
				for (const [k, v] of Object.entries(o)) {
					if (!this._entries.has(k as K))
						result[k as K] = v;
				}
				break;
			case FieldMaskType.Include:
				for (const [k, v] of Object.entries(o)) {
					if (this._entries.has(k as K))
						result[k as K] = v;
				}
				break;
		}
		return result;
	}
}
