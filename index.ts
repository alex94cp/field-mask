export enum FieldMaskType {
	Exclude = 'exclude',
	Include = 'include',
}

export type FieldMaskConvertible = Iterable<string>
                                 | Record<string, any>
                                 | FieldMask;

export class FieldMask {
	private _entries: Set<string> = new Set;

	constructor(public type = FieldMaskType.Include) {
	}

	static exclude(excluded: Iterable<string>): FieldMask {
		const mask = new FieldMask(FieldMaskType.Exclude);
		mask.add(...excluded);
		return mask;
	}

	static include(included: Iterable<string>): FieldMask {
		const mask = new FieldMask(FieldMaskType.Include);
		mask.add(...included);
		return mask;
	}

	static from(from: FieldMaskConvertible): FieldMask {
		if (from instanceof FieldMask) {
			return from;
		} else if (Array.isArray(from)) {
			return FieldMask.include(from);
		} else {
			let maskType = undefined;
			for (const v of Object.values(from)) {
				if (maskType === undefined) {
					maskType = v ? FieldMaskType.Include : FieldMaskType.Exclude;
				} else if ((maskType === FieldMaskType.Exclude && v !== 0) ||
				           (maskType === FieldMaskType.Include && v !== 1)) {
					throw new Error('Invalid field mask object');
				}
			}
			maskType = maskType || FieldMaskType.Exclude;
			const mask = new FieldMask(maskType);
			mask.add(...Object.keys(from));
			return mask;
		}
	}

	add(...fields: string[]): void {
		fields.forEach(f => this._entries.add(f));
	}

	get(): Record<string, 0 | 1> {
		const result = {} as Record<string, 0 | 1>;
		this._entries.forEach(f => {
			switch (this.type) {
			case FieldMaskType.Exclude: result[f] = 0; break;
			case FieldMaskType.Include: result[f] = 1; break;
			}
		});
		return result;
	}

	includes(field: string): boolean {
		switch (this.type) {
			case FieldMaskType.Exclude:
				return !this._entries.has(field);
			case FieldMaskType.Include:
				return this._entries.has(field);
		}
	}

	excludes(field: string): boolean {
		switch (this.type) {
			case FieldMaskType.Exclude:
				return this._entries.has(field);
			case FieldMaskType.Include:
				return !this._entries.has(field);
		}
	}

	equals(other: FieldMaskConvertible): boolean {
		const otherMask = FieldMask.from(other);
		if (this.type !== otherMask.type) return false;
		for (const field of this._entries) {
			if (!otherMask._entries.has(field))
				return false;
		}
		for (const field of otherMask._entries) {
			if (!this._entries.has(field))
				return false;
		}
		return true;
	}

	negate(): FieldMask {
		switch (this.type) {
			case FieldMaskType.Exclude:
				return FieldMask.include(this._entries);
			case FieldMaskType.Include:
				return FieldMask.exclude(this._entries);
		}
	}

	join(otherFrom: FieldMaskConvertible): FieldMask {
		const entries = [...this._entries];
		const other = FieldMask.from(otherFrom);
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

	intersect(otherFrom: FieldMaskConvertible): FieldMask {
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

	apply<T extends Record<string, any>>(o: T): Record<string, any> {
		const result: Record<string, any> = {};
		switch (this.type) {
			case FieldMaskType.Exclude:
				for (const [k, v] of Object.entries(o)) {
					if (!this._entries.has(k))
						result[k] = v;
				}
				break;
			case FieldMaskType.Include:
				for (const [k, v] of Object.entries(o)) {
					if (this._entries.has(k))
						result[k] = v;
				}
				break;
		}
		return result;
	}
}