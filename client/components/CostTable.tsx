import React from "react";
import { MaterialCost } from "../types";
import { Edit2 } from "lucide-react";

interface CostTableProps {
  materials: MaterialCost[];
  currency: string;
  onUpdateRate: (id: string, newRate: number) => void;
}

export const CostTable: React.FC<CostTableProps> = ({
  materials,
  currency,
  onUpdateRate,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(val);
  };

  const categories = Array.from(new Set(materials.map((m) => m.category)));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-slate-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Material
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Rate ({currency})
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {categories.map((cat) => (
              <React.Fragment key={cat}>
                <tr className="bg-gray-50 dark:bg-slate-700/50">
                  <td
                    colSpan={5}
                    className="px-6 py-2 text-sm font-bold text-gray-700 dark:text-slate-200"
                  >
                    {cat}
                  </td>
                </tr>
                {materials
                  .filter((m) => m.category === cat)
                  .map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100 font-medium">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                        {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-slate-100">
                        {item.quantity.toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-slate-100">
                        <div className="flex items-center justify-end group cursor-pointer relative">
                          <input
                            type="number"
                            className="w-24 text-right border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500 rounded-md sm:text-sm p-1 border"
                            value={item.unitRate}
                            onChange={(e) =>
                              onUpdateRate(
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                          <Edit2 className="w-3 h-3 text-gray-400 dark:text-slate-500 ml-2 opacity-0 group-hover:opacity-100 absolute -right-4" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900 dark:text-slate-100">
                        {formatCurrency(item.totalCost)}
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr>
              <td
                colSpan={4}
                className="px-6 py-4 text-right font-bold text-gray-900"
              >
                Grand Total
              </td>
              <td className="px-6 py-4 text-right font-bold text-blue-600 text-lg">
                {formatCurrency(
                  materials.reduce((acc, curr) => acc + curr.totalCost, 0)
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
