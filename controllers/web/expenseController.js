/**
 * export.method = req, res function
 *
 */

const Expenses = require("../../models/expense");
// const Project = require("../../models/project");

exports.createExpenses = async (req, res) => {
  const { mdas, companies, expenseAmount, expenseDesc, paymentDate } = req.body;
  let expenses = new Expenses({
    mdas,
    companies,
    expenseAmount,
    expenseDesc,
    paymentDate,
  });
  await expenses.save();

  //reponse message
  res.status(200).send({
    status: true,
    message: "Expenses created successfully",
  });
};

exports.getCompanyFunds = (req, res, next) => {
  Expenses.find({})
    .populate("mdas")
    .populate("companies")
    .then((expenses) => {
      let expense = {},
        result = [];
      expenses.forEach((exp) => {
        expense.mda = exp.mdas.name;
        expense.mdaHandle = exp.mdas.twitter_handle;
        expense.companyName = exp.companies.name;
        expense.companyHandle = exp.companies.twitter_handle;
        expense.companyHead = exp.companies.head;
        expense.companyHeadHandle = exp.companies.head_handle;
        expense.project = exp.expenseDesc;
        expense.projectAm = exp.expenseAmount;
        expense.paymentDate = exp.paymentDate;
        result.push(expense);
      });
      res.status(200).json({
        status: "success",
        message: "All Companies and Funds Received",
        data: result,
      });
    })
    .catch(next);
};

/*
 *Returns Total monthly expenses by all MDAs
 */
exports.getTotalMonthlyExpenses = async (req, res) => {
  try {
    const monthNames = [
      "",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    await Expenses.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$paymentDate" },
            year: { $year: "$paymentDate" },
          },
          total: { $sum: "$expenseAmount" },
        },
      },
    ]).exec((err, result) => {
      if (err) throw err;
      let all_totals = [];
      for (let i = 0; i <= result.length - 1; i++) {
        if (parseInt(result[i]._id.year) == new Date().getFullYear()) {
          all_totals.push({
            month: monthNames[result[i]._id.month],
            year: result[i]._id.year,
            total: result[i].total,
          });
        }
      } //aggregate exec ends here

      let current_month_total;
      let current_month = new Date().getMonth() + 1;
      all_totals.forEach((dd) => {
        if (dd.month === current_month) current_month_total = dd.total;
      }); //current month total

      return res.status(200).json({
        status: "success",
        message: "monthly total expenses of all MDAs for the the current year",
        current_month_total: current_month_total || 0,
        all_totals,
      }); // JSON return ends here
    }); //try ends here
  } catch (err) {
    return res
      .status(400)
      .json({ status: "Failed", message: err.message, data: null });
  }
};

exports.getExpensesByYearAndMonth = async (req, res) => {
  try {
    // FInd by Year and Month
    let year = req.params.year;
    let month = req.params.month;
    const expenses = await Expenses.find({
      paymentDate: {
        $lt: Date(`${year}-${month}`),
      },
    }).populate("mdas companies");

    return res.status(200).json({
      status: "success",
      message: "Total and breakdown of all expenses",
      data: { expenses },
    });
  } catch (err) {
    return res
      .status(400)
      .json({ status: "Failed", message: err.message, data: null });
  }
};

exports.getSingleExpense = async (req, res) => {
  try {
    const expense = await Expenses.findById(req.params.id).populate(
      "mdas companies"
    );
    if (!expense)
      return res.status(404).json({
        status: "failed",
        message: "Expense not found",
        data: null,
      });

    res.status(200).json({
      status: "success",
      message: "Expense Details",
      data: { expense },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
      data: null,
    });
  }
};

/*
  Please do not modify. There's a frontend Implementation already that depends on this
*/
exports.getExpenses = async (req, res, next) => {
  const { _page, _limit } = req.query;
  const count = await Expenses.countDocuments();

  Expenses.find({})
    .populate("mdas companies")
    .limit(_limit * 1)
    .skip((_page - 1) * _limit)
    .then((expenses) => {
      res.status(200).json({
        status: "success",
        message: `Expenses retrieved for Page ${_page}`,
        data: {
          totalCount: count,
          totalPages: Math.ceil(count / _limit),
          currentPage: +_page,
          expenses,
        },
      });
    })
    .catch(next);
};
