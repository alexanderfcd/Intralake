const config = {
  protocol: "https",
  port: 777,

  stripe: {
    secret: "",
    public: "",

    paymentPagePath: "/checkout",
    methods: ["card"],
  },
};

const projects = {};

projects.intralake = {
  stripe: {
    public: "pk_test_",
    secret: "sk_test_",

    paymentPagePath: "/checkout",
    methods: ["card"],
  },
};

const ActiveProject = "intralake";

module.exports = Object.assign(
  {},
  config,
  ActiveProject ? projects[ActiveProject] || {} : {}
);
