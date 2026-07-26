const MAX_SIZE = 100;

/*
    LFUCache class implements a Least Frequently Used (LFU) cache with O(1) eviction.
    It maintains a cache of key-value pairs with a maximum size limit.
    When the cache exceeds the maximum size, it evicts the least frequently used entry.
    In case of ties in frequency, it evicts the entry that was inserted or accessed earliest.
    @param {number} maxSize - The maximum number of entries the cache can hold (default is 100).
*/
class LFUCache {
    /*
        Initializes the LFUCache with a maximum size.
        @param {number} maxSize - The maximum number of entries the cache can hold (default is 100).
    */
    constructor(maxSize = MAX_SIZE) {
        this.maxSize = maxSize;
        this.cache = new Map();   // key -> { value, freq }
        this.freqMap = new Map(); // freq -> Set of keys (insertion-ordered)
        this.minFreq = 0;
    }

    /*
        Increments the frequency of a key and moves it to the correct frequency bucket.
        @param {any} key - The cache key to promote.
        @param {Object} entry - The cache entry for the key.
    */
    _promoteKey(key, entry) {
        const oldFreq = entry.freq;
        const newFreq = oldFreq + 1;
        entry.freq = newFreq;

        // Remove from old frequency bucket
        const oldBucket = this.freqMap.get(oldFreq);
        if (oldBucket) {
            oldBucket.delete(key);
            if (oldBucket.size === 0) {
                this.freqMap.delete(oldFreq);
                if (this.minFreq === oldFreq) {
                    this.minFreq = newFreq;
                }
            }
        }

        // Add to new frequency bucket
        if (!this.freqMap.has(newFreq)) {
            this.freqMap.set(newFreq, new Set());
        }
        this.freqMap.get(newFreq).add(key);
    }

    /*
        Retrieves the value associated with the given key from the cache.
        If the key exists, it increments its frequency count and returns the value.
        If the key does not exist, it returns undefined.
        @param {any} key - The key to retrieve from the cache.
        @returns {any} - The value associated with the key, or undefined if the key does not exist.
    */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return undefined;
        this._promoteKey(key, entry);
        return entry.value;
    }

    /*
        Checks if the cache contains the given key.
        @param {any} key - The key to check in the cache.
        @returns {boolean} - True if the key exists in the cache, false otherwise.
    */
    has(key) {
        return this.cache.has(key);
    }

    /*
        Sets the value for the given key in the cache.
        If the key already exists, it updates its value and increments its frequency count.
        If the cache is full, it evicts the least frequently used entry before inserting.
        @param {any} key - The key to set in the cache.
        @param {any} value - The value to associate with the key.
    */
    set(key, value) {
        if (this.maxSize <= 0) return;

        if (this.cache.has(key)) {
            const entry = this.cache.get(key);
            entry.value = value;
            this._promoteKey(key, entry);
            return;
        }

        if (this.cache.size >= this.maxSize) {
            this._evictLFU();
        }

        this.cache.set(key, { value, freq: 1 });
        this.minFreq = 1;

        if (!this.freqMap.has(1)) {
            this.freqMap.set(1, new Set());
        }
        this.freqMap.get(1).add(key);
    }

    /*
        Evicts the least frequently used entry from the cache in O(1) time.
        Uses the minFreq tracker to find the bucket, then evicts the oldest key
        in that bucket (first element of the Set, which preserves insertion order).
    */
    _evictLFU() {
        const bucket = this.freqMap.get(this.minFreq);
        if (!bucket || bucket.size === 0) return;

        // Set iterator gives insertion order — first key is the oldest
        const lfuKey = bucket.values().next().value;
        bucket.delete(lfuKey);
        if (bucket.size === 0) {
            this.freqMap.delete(this.minFreq);
        }
        this.cache.delete(lfuKey);
    }

    /*
        Deletes the entry associated with the given key from the cache.
        @param {any} key - The key to delete from the cache.
    */
    delete(key) {
        const entry = this.cache.get(key);
        if (!entry) return;

        const bucket = this.freqMap.get(entry.freq);
        if (bucket) {
            bucket.delete(key);
            if (bucket.size === 0) {
                this.freqMap.delete(entry.freq);
            }
        }
        this.cache.delete(key);
    }
}

export default LFUCache;