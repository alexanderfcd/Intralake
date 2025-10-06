const AWS = require("aws-sdk");
const config = require("./config");

const safePromise = (promise) =>
  promise.then((data) => [data, null]).catch((error) => [null, error]);

class S3BucketService {
  constructor(configS3) {
    this.s3 = new AWS.S3(configS3 || config.S3);
  }

  async createBucket(name) {
    const params = {
      Bucket: name,
      ACL: "private",
    };
    return await safePromise(this.s3.createBucket(params).promise());
  }

  async setBucketPolicy(name) {
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: [
            "s3:AbortMultipartUpload",
            "s3:GetObject",
            "s3:ListBucketMultipartUploads",
            "s3:ListMultipartUploadParts",
            "s3:PutObject",
          ],
          Resource: [`arn:aws:s3:::${name}`, `arn:aws:s3:::${name}/*`],
        },
      ],
    };

    const params = {
      Bucket: name,
      Policy: JSON.stringify(policy),
    };

    return await safePromise(this.s3.putBucketPolicy(params).promise());
  }

  async createBucketAndSetPolicy(name) {
    if (!name) {
      const _str = (Math.random() + 1).toString(36).substring(7);
      name = `il-${Date.now()}-${_str}`;
    }

    return new Promise(async (resolve, reject) => {
      const [data, error] = await this.s3.createBucket(name).promise();
      if (error) {
        reject(error);
        return;
      }
      const [dataPolicy, errorPolicy] = await this.s3
        .setBucketPolicy(name)
        .promise();
      if (errorPolicy) {
        reject(errorPolicy);
        return;
      }
      resolve({ data, dataPolicy });
    });
  }

  /**
   * Track S3 usage between a start date and end date
   * @param {string} start - Date object
   * @param {string} end -   Date object
   * @param {string} bucketName - The name of the S3 bucket
   * @returns {Promise} - Promise that resolves with CloudWatch metrics for S3 usage
   */
  async usage(start, end, bucketName) {
    AWS.config.update({
      accessKeyId: this.s3.accessKeyId,
      secretAccessKey: this.s3.secretAccessKey,
      region: this.s3.region,
    });

    const cloudwatch = new AWS.CloudWatch();

    try {
      // Set up the CloudWatch metric query for S3
      const params1 = {
        StartTime: start,
        EndTime: end,
        MetricName: "NumberOfObjects",
        Namespace: "AWS/S3",
        Dimensions: [
          {
            Name: "BucketName",
            Value: bucketName,
          },
          {
            Name: "StorageType",
            Value: "StandardStorage",
          },
        ],
        Period: 86400, // Period is in seconds, so this is a 1-day period
        Statistics: ["Sum"], // 'Sum' gives you the total over the period
      };
      const params = {
        Namespace: "AWS/S3",
        MetricName: "BucketSizeBytes",
        Dimensions: [
          {
            Name: "BucketName",
            Value: "your-bucket-name",
          },
          {
            Name: "StorageType",
            Value: "StandardStorage",
          },
        ],
        StartTime: new Date(new Date().getTime() - 3600 * 1000), // 1 hour ago
        EndTime: new Date(),
        Period: 60, // 1-minute intervals
        Statistics: ["Average"],
      };

      // Call CloudWatch to get the metrics data
      const resData = await cloudwatch.getMetricStatistics(params).promise();

      console.log(resData);
      return { resData };
    } catch (error) {
      console.error("Error tracking S3 usage:", error);
    }
  }
}

module.exports = {
  S3BucketService,
};
