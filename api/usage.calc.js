const exampleJSON = [
  {
    type: "file",
    size: 10485760,
    date: "2019-08-11T00:00:00.000Z",
    user: "507f1f77bcf86cd799439011",
    deletedOn: "2019-08-11T00:00:00.000Z",
    deletedBy: "507f1f77bcf86cd7994234",
    objectId: "107f1f77bcfbbcd791239011",
  },
  {
    type: "sign",
    size: 77991342,
    date: "2011-08-11T00:00:00.000Z",
    user: "507f1f77bcf86cd799439011",
  },
  {
    type: "preview",
    size: 10485760,
    uploadDate: "2019-08-11T00:00:00.000Z",
    user: "507f1f77bcf86cd799439011",
  },
];

class UsageCalc {
  constructor(options) {
    const { data, startDate, endDate, storagePriceGiBH, dataTransferPrice } =
      options;
    this.data = data || [];
    this.startDate = startDate;
    this.endDate = endDate || new Date();
    this.storagePriceGiBH = storagePriceGiBH;
    this.dataTransferPrice = dataTransferPrice;
  }

  #storageTypes = ["file", "fileUpload", "sign"];
  #dataTransferTypes = ["preview"];

  setData(data) {
    this.data = data || [];
  }

  getDatesRange() {
    const ms = this.endDate - this.startDate;
    const hours = ms / (1000 * 60 * 60);
    const days = ms / (1000 * 60 * 60 * 24);

    return {
      ms,
      days,
      hours,
    };
  }

  isInDateRange(item) {
    const uploadDate = new Date(item.date);
    return uploadDate >= this.startDate && uploadDate <= this.endDate;
  }

  bytesToGiB(bytes) {
    const gibibyte = 1024 * 1024 * 1024; // 1 GiB = 1024^3 bytes
    return bytes / gibibyte;
  }

  gibh(item) {
    let date,
      endDate = this.endDate;
    item.date = new Date(item.date);
    if (this.startDate < item.date) {
      date = new Date(item.date);
    } else {
      date = new Date(this.startDate);
    }

    if (item.deletedOn) {
      item.deletedOn = new Date(item.deletedOn);
      endDate = item.deletedOn;
    }

    const diff = endDate - date;
    const hours = diff / (1000 * 60 * 60);

    return {
      hours,
      gib: this.bytesToGiB(item.size),
    };
  }

  dataTransfer() {
    let total = 0;
    for (let i = 0; i < this.data.length; i++) {
      const item = this.data[i];
      if (
        this.#dataTransferTypes.indexOf(item.type) !== -1 &&
        this.isInDateRange(item)
      ) {
        total += item.size;
      }
    }
    return total * this.dataTransferPrice;
  }

  storage() {
    const examplePrice = 0.00003091397;
    /// AWS -  S3 Standard  - $0.023 per GB -- 0.023/31/24
    let total = 0;
    for (let i = 0; i < this.data.length; i++) {
      const item = this.data[i];
      if (
        this.#storageTypes.indexOf(item.type) !== -1 &&
        this.isInDateRange(item)
      ) {
        const gibh = this.gibh(item);
        const usage = gibh.gib * gibh.hours;
        total += usage * this.storagePriceGiBH;
      }
    }
    return Math.floor(total);
  }

  usage() {
    return {
      storage: this.storage(),
      dataTransfer: this.dataTransfer(),
      dateRange: this.getDatesRange(),
    };
  }
}

module.exports = {
  UsageCalc,
};
