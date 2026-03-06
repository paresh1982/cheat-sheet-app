export interface ToolData {
  id: string;
  name: string;
  color: string;
}

export type Category = 
  | 'Data I/O & Setup'
  | 'Filtering & Sorting'
  | 'Aggregation & Grouping'
  | 'Merging & Joining'
  | 'Data Cleaning & Logic'
  | 'Text & Dates'
  | 'Window Functions'
  | 'Statistics & Math';

export interface Formula {
  id: string;
  toolId: string;
  category: Category;
  name: string;
  concept: string;
  syntax: string;
  explanation: string;
  isFavorite?: boolean;
  examples: {
    title: string;
    code: string;
    description: string;
  }[];
}

export const tools: ToolData[] = [
  { id: 'sql', name: 'PostgreSQL', color: '#336791' },
  { id: 'python', name: 'Python', color: '#3776AB' },
  { id: 'r', name: 'R', color: '#276DC3' },
  { id: 'excel', name: 'Excel', color: '#1D6F42' },
  { id: 'powerbi', name: 'Power BI (DAX)', color: '#F2C811' },
  { id: 'tableau', name: 'Tableau', color: '#E97627' },
  { id: 'bash', name: 'Bash / Linux', color: '#4EAA25' },
  { id: 'git', name: 'Git', color: '#F05032' },
];

export const formulas: Formula[] = [
  // ================= EXCEL =================
  {
    id: 'ex_filter', toolId: 'excel', category: 'Filtering & Sorting', name: 'FILTER',
    concept: 'Extract multiple matching records from a dataset without hiding rows.',
    syntax: '=FILTER(array, include, [if_empty])',
    explanation: 'Returns an array of values based on a boolean condition. Dynamic array function.',
    examples: [
      { title: 'Filter by Region', code: '=FILTER(A2:D100, B2:B100="North", "No Data")', description: 'Returns all rows where the region is North.' },
      { title: 'Multiple Conditions', code: '=FILTER(A2:D100, (B2:B100="North") * (C2:C100>500))', description: 'Filters for North region AND sales > 500.' }
    ]
  },
  {
    id: 'ex_xlookup', toolId: 'excel', category: 'Merging & Joining', name: 'XLOOKUP',
    concept: 'Modern replacement for VLOOKUP. Find data in any column and return from another.',
    syntax: '=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])',
    explanation: 'Searches a range and returns the item corresponding to the first match. Can search right-to-left.',
    examples: [
      { title: 'Basic Lookup', code: '=XLOOKUP(F2, A2:A100, C2:C100, "Not Found")', description: 'Finds ID in A, returns Name in C.' },
      { title: 'Two-Way Lookup', code: '=XLOOKUP(F2, A2:A10, XLOOKUP(G2, B1:D1, B2:D10))', description: 'Finds exact intersection of a row and column.' }
    ]
  },
  {
    id: 'ex_ifs', toolId: 'excel', category: 'Data Cleaning & Logic', name: 'IFS / IF',
    concept: 'Apply conditional logic to categorize or clean data based on multiple tests.',
    syntax: '=IFS(condition1, value1, condition2, value2, ...)',
    explanation: 'Evaluates multiple conditions in order. Replaces nested IF statements.',
    examples: [
      { title: 'Tier Grading', code: '=IFS(A2>=90, "A", A2>=80, "B", TRUE, "C")', description: 'Assigns grades. TRUE acts as the default catch-all.' },
      { title: 'Simple Flag', code: '=IF(B2>1000, "High Value", "Standard")', description: 'Basic binary classification.' }
    ]
  },
  {
    id: 'ex_textsplit', toolId: 'excel', category: 'Text & Dates', name: 'TEXTSPLIT / TEXTJOIN',
    concept: 'Combine multiple strings into one, or break one string into multiple cells.',
    syntax: '=TEXTSPLIT(text, col_delimiter, [row_delimiter])\n=TEXTJOIN(delimiter, ignore_empty, text1...)',
    explanation: 'Essential for cleaning messy data formats.',
    examples: [
      { title: 'Split Names', code: '=TEXTSPLIT(A2, ", ")', description: 'Splits "Smith, John" into two separate columns.' },
      { title: 'Combine IDs', code: '=TEXTJOIN("-", TRUE, A2, B2, C2)', description: 'Merges pieces with a hyphen, ignoring blank cells.' }
    ]
  },
  {
    id: 'ex_sumifs', toolId: 'excel', category: 'Aggregation & Grouping', name: 'SUMIFS',
    concept: 'Sum numeric values that meet one or more criteria.',
    syntax: '=SUMIFS(sum_range, criteria_range1, criteria1, ...)',
    explanation: 'The foundation of Excel reporting without Pivot Tables.',
    examples: [
      { title: 'Sum by Category', code: '=SUMIFS(Sales, Category, "Electronics")', description: 'Totals all tech sales.' },
      { title: 'Date Range Sum', code: '=SUMIFS(Sales, Date, ">=1/1/2023", Date, "<=1/31/2023")', description: 'Sums sales strictly within January.' }
    ]
  },

  // ================= SQL =================
  {
    id: 'sql_select', toolId: 'sql', category: 'Filtering & Sorting', name: 'SELECT / WHERE / ORDER BY',
    concept: 'The foundation of querying. Retrieve specific columns, filter rows, and sort output.',
    syntax: 'SELECT col1, col2 \nFROM table \nWHERE condition \nORDER BY col1 DESC;',
    explanation: 'WHERE filters rows before aggregation. ORDER BY sorts the final result set.',
    examples: [
      { title: 'Basic Filter', code: 'SELECT name, age FROM users WHERE status = \'active\' ORDER BY age DESC;', description: 'Gets active users, oldest first.' },
      { title: 'Pattern Matching', code: 'SELECT * FROM products WHERE name ILIKE \'%pro%\';', description: 'Finds products containing "pro" (case-insensitive in Postgres).' }
    ]
  },
  {
    id: 'sql_groupby', toolId: 'sql', category: 'Aggregation & Grouping', name: 'GROUP BY / HAVING',
    concept: 'Group rows sharing a property so an aggregate function (SUM, AVG) can be applied.',
    syntax: 'SELECT category, SUM(sales) \nFROM data \nGROUP BY category \nHAVING SUM(sales) > 1000;',
    explanation: 'HAVING filters *after* aggregation (unlike WHERE which filters before).',
    examples: [
      { title: 'Revenue by Dept', code: 'SELECT dept, COUNT(*), AVG(salary) FROM employees GROUP BY dept;', description: 'Gets headcount and average salary per department.' },
      { title: 'Filter Groups', code: 'SELECT region, SUM(profit) FROM sales GROUP BY region HAVING SUM(profit) < 0;', description: 'Identifies regions operating at a loss.' }
    ]
  },
  {
    id: 'sql_join', toolId: 'sql', category: 'Merging & Joining', name: 'LEFT JOIN / INNER JOIN',
    concept: 'Combine columns from one or more tables based on a related key.',
    syntax: 'SELECT a.col, b.col \nFROM table_a a \nLEFT JOIN table_b b ON a.id = b.id;',
    explanation: 'INNER keeps matches only. LEFT keeps everything from the first table and appends matches.',
    examples: [
      { title: 'Enrich Data', code: 'SELECT o.order_id, c.name FROM orders o LEFT JOIN customers c ON o.user_id = c.id;', description: 'Gets all orders and attaches customer names if known.' },
      { title: 'Find Missing', code: 'SELECT u.id FROM users u LEFT JOIN logs l ON u.id = l.user_id WHERE l.session_id IS NULL;', description: 'Finds users who have never logged in.' }
    ]
  },
  {
    id: 'sql_window', toolId: 'sql', category: 'Window Functions', name: 'ROW_NUMBER() / RANK() OVER',
    concept: 'Perform calculations across a set of table rows related to the current row, without grouping them into a single output row.',
    syntax: 'ROW_NUMBER() OVER (PARTITION BY col1 ORDER BY col2 DESC)',
    explanation: 'Allows you to rank or number items within specific categories.',
    examples: [
      { title: 'Top Per Category', code: 'SELECT * FROM (\n  SELECT name, dept, salary, RANK() OVER (PARTITION BY dept ORDER BY salary DESC) as rnk\n  FROM employees\n) x WHERE rnk = 1;', description: 'Finds the highest earner in every department.' },
      { title: 'Running Total', code: 'SELECT date, amount, SUM(amount) OVER (ORDER BY date) as running_total FROM sales;', description: 'Calculates a cumulative sum ordered by date.' }
    ]
  },
  {
    id: 'sql_cte', toolId: 'sql', category: 'Data Cleaning & Logic', name: 'WITH (CTEs) / CASE',
    concept: 'Organize complex queries into readable blocks and apply IF/THEN logic.',
    syntax: 'WITH cte_name AS (SELECT ...) \nSELECT *, CASE WHEN x THEN y ELSE z END FROM cte_name;',
    explanation: 'CTEs (Common Table Expressions) make code modular. CASE is SQL\'s IF statement.',
    examples: [
      { title: 'Data Binning', code: 'SELECT age, CASE \n  WHEN age < 18 THEN \'Minor\' \n  ELSE \'Adult\' \nEND as age_group FROM users;', description: 'Categorizes continuous age data into discrete bins.' },
      { title: 'Modular Query', code: 'WITH regional_sales AS (SELECT region, SUM(amount) as total FROM sales GROUP BY region)\nSELECT * FROM regional_sales WHERE total > 1M;', description: 'Calculates totals first, then filters the results.' }
    ]
  },

  // ================= PYTHON =================
  {
    id: 'py_io', toolId: 'python', category: 'Data I/O & Setup', name: 'pd.read_csv() / pd.DataFrame()',
    concept: 'Load data into Pandas from external files or Python dictionaries.',
    syntax: 'df = pd.read_csv("filepath.csv", sep=",", usecols=["A", "B"])',
    explanation: 'The entry point for all Python data analysis.',
    examples: [
      { title: 'Load CSV', code: 'import pandas as pd\ndf = pd.read_csv("data.csv", parse_dates=["date_col"])', description: 'Loads a CSV and automatically converts a column to DateTime.' },
      { title: 'SQL to Pandas', code: 'import sqlite3\nconn = sqlite3.connect("db.sqlite")\ndf = pd.read_sql("SELECT * FROM table", conn)', description: 'Executes a SQL query and stores the result as a DataFrame.' }
    ]
  },
  {
    id: 'py_loc', toolId: 'python', category: 'Filtering & Sorting', name: 'df.loc[] / df.query()',
    concept: 'Slice, filter, and extract subsets of your dataframe.',
    syntax: 'df.loc[row_condition, [\'col1\', \'col2\']]',
    explanation: '.loc is label-based indexing. Masks are used to filter rows.',
    examples: [
      { title: 'Multi-Condition Filter', code: 'filtered = df.loc[(df["age"] > 30) & (df["city"] == "NY")]', description: 'Filters rows using bitwise AND (&).' },
      { title: 'Query Syntax', code: 'filtered = df.query("age > 30 and city == \'NY\'")', description: 'A cleaner string-based alternative for filtering.' }
    ]
  },
  {
    id: 'py_groupby', toolId: 'python', category: 'Aggregation & Grouping', name: 'df.groupby().agg()',
    concept: 'Split data into groups, apply functions, and combine results.',
    syntax: 'df.groupby("col").agg({"target_col": ["mean", "sum"]})',
    explanation: 'The Pandas equivalent of SQL GROUP BY.',
    examples: [
      { title: 'Simple Aggregate', code: 'df.groupby("department")["salary"].mean().reset_index()', description: 'Gets average salary per department and keeps it as a dataframe.' },
      { title: 'Multiple Metrics', code: 'df.groupby("region").agg(total_sales=("sales", "sum"), avg_margin=("margin", "mean"))', description: 'Calculates multiple distinct metrics and renames the output columns.' }
    ]
  },
  {
    id: 'py_merge', toolId: 'python', category: 'Merging & Joining', name: 'pd.merge() / pd.concat()',
    concept: 'Combine dataframes horizontally (joins) or vertically (append).',
    syntax: 'pd.merge(left, right, on="key", how="left")\npd.concat([df1, df2])',
    explanation: 'Merge maps to SQL joins. Concat stacks dataframes on top of each other.',
    examples: [
      { title: 'VLOOKUP Equivalent', code: 'final_df = pd.merge(sales, products, left_on="prod_id", right_on="id", how="left")', description: 'Attaches product info to sales records.' },
      { title: 'Stacking Files', code: 'df_all = pd.concat([df_jan, df_feb, df_mar], ignore_index=True)', description: 'Appends three monthly dataframes into one large dataset.' }
    ]
  },
  {
    id: 'py_dates', toolId: 'python', category: 'Text & Dates', name: 'pd.to_datetime() / .str accessor',
    concept: 'Clean and extract features from text and date columns.',
    syntax: 'df["date"] = pd.to_datetime(df["date"])\ndf["text"].str.lower()',
    explanation: 'Provides vectorized operations for strings and dates without needing loops.',
    examples: [
      { title: 'Extract Month', code: 'df["month"] = pd.to_datetime(df["date_str"]).dt.month_name()', description: 'Converts text to date, then extracts "January", "February", etc.' },
      { title: 'Regex Extraction', code: 'df["email_domain"] = df["email"].str.extract(r\'@([A-Za-z0-9.-]+)\')', description: 'Uses regex to pull domain names from an email column.' }
    ]
  },

  // ================= R =================
  {
    id: 'r_filter', toolId: 'r', category: 'Filtering & Sorting', name: 'filter() / arrange() (dplyr)',
    concept: 'Subset rows using column values and reorder the dataset.',
    syntax: 'df %>% filter(condition) %>% arrange(desc(col))',
    explanation: 'Part of the Tidyverse. Highly readable, chainable commands.',
    examples: [
      { title: 'Filter and Sort', code: 'clean_data <- df %>%\n  filter(status == "Active", score > 80) %>%\n  arrange(desc(score))', description: 'Keeps high-scoring active users, sorted highest to lowest.' },
      { title: 'In Operator', code: 'df %>% filter(region %in% c("North", "South"))', description: 'Filters for multiple specific categories.' }
    ]
  },
  {
    id: 'r_summarize', toolId: 'r', category: 'Aggregation & Grouping', name: 'group_by() %>% summarize()',
    concept: 'Collapse many values down to a single summary statistic per group.',
    syntax: 'df %>% group_by(col) %>% summarize(avg = mean(val, na.rm=T))',
    explanation: 'The R equivalent of SQL GROUP BY.',
    examples: [
      { title: 'Grouped Stats', code: 'df %>%\n  group_by(treatment) %>%\n  summarize(count = n(), avg_recovery = mean(days))', description: 'Calculates patient count and recovery time per treatment group.' },
      { title: 'Multiple Groups', code: 'df %>% group_by(year, month) %>% summarize(total = sum(revenue))', description: 'Rolls up data by year and month.' }
    ]
  },
  {
    id: 'r_join', toolId: 'r', category: 'Merging & Joining', name: 'left_join() / bind_rows()',
    concept: 'Combine data frames by matching columns or stacking rows.',
    syntax: 'left_join(x, y, by = "key")\nbind_rows(df1, df2)',
    explanation: 'dplyr provides intuitive naming for standard database joins.',
    examples: [
      { title: 'Safe Join', code: 'enriched <- orders %>%\n  left_join(customers, by = c("customer_id" = "id"))', description: 'Matches tables where the key column names differ.' },
      { title: 'Anti Join', code: 'anti_join(users, purchases, by="user_id")', description: 'Returns only the users who have NEVER made a purchase.' }
    ]
  },
  {
    id: 'r_pivot', toolId: 'r', category: 'Data Cleaning & Logic', name: 'pivot_longer() / pivot_wider()',
    concept: 'Reshape data layouts between "wide" (human readable) and "long" (machine readable) formats.',
    syntax: 'df %>% pivot_longer(cols = c(Q1, Q2), names_to="Quarter", values_to="Revenue")',
    explanation: 'Essential for plotting in ggplot2, which requires "long" tidy data.',
    examples: [
      { title: 'Melt Data', code: 'wide_df %>% pivot_longer(cols = starts_with("Year_"), names_to="Year", values_to="GDP")', description: 'Converts year columns into a single Year column and a single GDP column.' },
      { title: 'Spread Data', code: 'long_df %>% pivot_wider(names_from=Metric, values_from=Value)', description: 'Turns a metrics column into individual columns (like a Pivot Table).' }
    ]
  }
];
