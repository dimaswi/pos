<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $parentId = $request->get('parent_id', '');
        $isActive = $request->get('is_active', '');

        $categories = Category::with(['parent', 'children'])
            ->when($search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($parentId !== '', function ($query) use ($parentId) {
                if ($parentId === 'null') {
                    return $query->whereNull('parent_id');
                }
                return $query->where('parent_id', $parentId);
            })
            ->when($isActive !== '', function ($query) use ($isActive) {
                return $query->where('is_active', (bool) $isActive);
            })
            ->orderBy('parent_id', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        $parentCategories = Category::whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('master-data/category/index', [
            'categories' => $categories,
            'parentCategories' => $parentCategories,
            'filters' => [
                'search' => $search,
                'parent_id' => $parentId,
                'is_active' => $isActive,
            ],
        ]);
    }

    public function create()
    {
        $parentCategories = Category::whereNull('parent_id')
            ->where('is_active', true)
            ->get();

        return Inertia::render('master-data/category/create', [
            'parentCategories' => $parentCategories
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:categories,code',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean'
        ]);

        Category::create($request->all());

        return redirect()->route('master-data.categories.index')
            ->with('success', 'Category created successfully.');
    }

    public function show(Category $category)
    {
        $category->load(['parent', 'children' => function ($query) {
            $query->where('is_active', true);
        }]);
        
        $category->loadCount('products');

        return Inertia::render('master-data/category/show', [
            'category' => $category
        ]);
    }

    public function edit(Category $category)
    {
        $parentCategories = Category::where('id', '!=', $category->id)
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->get();

        return Inertia::render('master-data/category/edit', [
            'category' => $category->load('parent'),
            'parentCategories' => $parentCategories
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:categories,code,' . $category->id,
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean'
        ]);

        $category->update($request->all());

        return redirect()->route('master-data.categories.index')
            ->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category)
    {
        if ($category->children()->count() > 0) {
            return back()->with('error', 'Cannot delete category with subcategories.');
        }

        if ($category->products()->count() > 0) {
            return back()->with('error', 'Cannot delete category with products.');
        }

        $category->delete();

        return redirect()->route('master-data.categories.index')
            ->with('success', 'Category deleted successfully.');
    }
}
